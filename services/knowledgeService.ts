/**
 * Knowledge Base Service
 * Searches the MongoDB cases collection via backend API
 */

import { knowledgeApi } from './api';

export interface KnowledgeSearchResult {
  problem: {
    id: string;
    title: string;
    description: string;
    solution: string;
    keywords: string[];
    category: string;
    confidence: number;
  } | null;
  matchPercentage: number;
  isMatched: boolean;
}

/**
 * Search cases for matching problems
 * This searches the real MongoDB cases collection
 */
export async function searchKnowledgeBase(
  problemDescription: string
): Promise<KnowledgeSearchResult> {
  try {
    // If description is too short, return no match
    if (!problemDescription || problemDescription.trim().length < 5) {
      return {
        problem: null,
        matchPercentage: 0,
        isMatched: false,
      };
    }

    // Search the cases collection via API
    // Uses proxy configured in vite.config.ts to forward to backend
    const response = await fetch('/api/cases', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cases');
    }

    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      return {
        problem: null,
        matchPercentage: 0,
        isMatched: false,
      };
    }

    // Find best matching case using keyword matching
    const cases = data.data;
    const bestMatch = findBestMatchInCases(problemDescription, cases);

    return bestMatch;
  } catch (error) {
    console.error('❌ Cases search error:', error);
    return {
      problem: null,
      matchPercentage: 0,
      isMatched: false,
    };
  }
}

/**
 * Find best matching case from cases collection
 */
function findBestMatchInCases(
  userDescription: string,
  cases: any[]
): KnowledgeSearchResult {
  const normalizedUserDesc = userDescription
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ');

  const userWords = normalizedUserDesc.split(' ');

  let bestMatch = {
    problem: null as any,
    matchPercentage: 0,
  };

  cases.forEach((caseItem) => {
    let matchedCount = 0;

    // Get all keywords from case (mainKeywords, extraKeywords, synonyms)
    const mainKeywords = caseItem.mainKeywords ? caseItem.mainKeywords.split('،').map((k: string) => k.trim()) : [];
    const extraKeywords = caseItem.extraKeywords ? caseItem.extraKeywords.split('،').map((k: string) => k.trim()) : [];
    const synonyms = caseItem.synonyms ? caseItem.synonyms.split('،').map((k: string) => k.trim()) : [];
    const negativeKeywords = caseItem.negativeKeywords ? caseItem.negativeKeywords.split('،').map((k: string) => k.trim()) : [];
    
    const allKeywords = [...mainKeywords, ...extraKeywords, ...synonyms];
    
    // Build searchable text
    const searchableText = [
      caseItem.category || '',
      caseItem.subCategory || '',
      ...allKeywords,
    ].join(' ').toLowerCase();

    // Check for negative keywords first (if any match, skip this case)
    let hasNegativeMatch = false;
    negativeKeywords.forEach((negKeyword: string) => {
      if (negKeyword && normalizedUserDesc.includes(negKeyword.toLowerCase())) {
        hasNegativeMatch = true;
      }
    });

    if (hasNegativeMatch) {
      return; // Skip this case
    }

    // Check main keywords (highest weight)
    mainKeywords.forEach((keyword: string) => {
      if (!keyword) return;
      const normalizedKeyword = keyword.toLowerCase();

      if (userWords.includes(normalizedKeyword)) {
        matchedCount += 3; // Main keywords have highest weight
      }
      else if (normalizedUserDesc.includes(normalizedKeyword)) {
        matchedCount += 2;
      }
    });

    // Check extra keywords (medium weight)
    extraKeywords.forEach((keyword: string) => {
      if (!keyword) return;
      const normalizedKeyword = keyword.toLowerCase();

      if (userWords.includes(normalizedKeyword)) {
        matchedCount += 2;
      }
      else if (normalizedUserDesc.includes(normalizedKeyword)) {
        matchedCount += 1;
      }
    });

    // Check synonyms (lower weight)
    synonyms.forEach((synonym: string) => {
      if (!synonym) return;
      const normalizedSynonym = synonym.toLowerCase();

      if (userWords.includes(normalizedSynonym)) {
        matchedCount += 1.5;
      }
      else if (normalizedUserDesc.includes(normalizedSynonym)) {
        matchedCount += 0.75;
      }
    });

    // Also check if user description words appear in searchable text
    userWords.forEach((word) => {
      if (word.length > 2 && searchableText.includes(word)) {
        matchedCount += 0.5;
      }
    });

    // Calculate percentage
    const totalPossibleMatches = Math.max((mainKeywords.length * 3) + (extraKeywords.length * 2) + (synonyms.length * 1.5), userWords.length);
    const matchPercentage = Math.round((matchedCount / totalPossibleMatches) * 100);

    // Update best match if this is better
    if (matchPercentage > bestMatch.matchPercentage) {
      bestMatch = {
        problem: {
          id: caseItem._id || caseItem.id,
          title: `${caseItem.category} - ${caseItem.subCategory}`,
          description: caseItem.caseId || '',
          solution: caseItem.responseText,
          keywords: allKeywords,
          category: caseItem.category || 'عام',
          confidence: caseItem.priority === 'High' ? 90 : caseItem.priority === 'Medium' ? 75 : 60,
        },
        matchPercentage,
      };
    }
  });

  return {
    problem: bestMatch.problem,
    matchPercentage: bestMatch.matchPercentage,
    isMatched: bestMatch.matchPercentage > 40, // 40% threshold
  };
}

/**
 * Get formatted response for matched problem
 */
export function getFormattedResponse(
  problem: any,
  customerName: string,
  entityType: string
): string {
  const entityTypeArabic = entityType === 'umrah' ? 'شركة عمرة' : 'وكيل خارجي';

  return `السلام عليكم ورحمة الله وبركاته،

العميل: ${customerName}
نوع الجهة: ${entityTypeArabic}

${problem.solution}

شكراً لتواصلكم معنا.`;
}

/**
 * Search knowledge base (database only - no fallback)
 * This is the main function to use in components
 */
export async function searchWithFallback(
  problemDescription: string,
  useMockAsFallback: boolean = false // Ignored - kept for backward compatibility
): Promise<KnowledgeSearchResult> {
  // Search real database only
  const result = await searchKnowledgeBase(problemDescription);

  // If we got a good match, return it
  if (result.isMatched && result.problem) {
    console.log('✅ Found match in database:', result.matchPercentage + '%');
    return result;
  }

  // No match found in database
  console.log('❌ No match found in database');
  return result;
}

export default {
  searchKnowledgeBase,
  searchWithFallback,
  getFormattedResponse,
};
