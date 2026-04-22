/**
 * Knowledge Base Service
 * Searches the MongoDB cases collection via backend API
 */
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
  debugBreakdown?: {
    caseDbId: string;
    caseId: string;
    keyword: {
      rawScore: number;
      boundedScore: number;
      weight: number;
      contribution: number;
    };
    usageFrequency: {
      score: number;
      weight: number;
      contribution: number;
    };
    freshness: {
      score: number;
      weight: number;
      contribution: number;
      createdAt: string | null;
    };
    metadata: {
      overallScore: number;
      weight: number;
      contribution: number;
      userTypeScore: number | null;
      categoryScore: number | null;
      subCategoryScore: number | null;
    };
    finalScore: number;
  };
}

export interface MatchingWeightsOptions {
  keywordMatchWeight?: number; // 0-100
  caseUsageFrequencyWeight?: number; // 0-100
  caseFreshnessWeight?: number; // 0-100
  caseMetadataMatchWeight?: number; // 0-100
  userTypeHint?: string;
  accountStatusHint?: string;
  categoryHint?: string;
  subCategoryHint?: string;
  includeDebugBreakdown?: boolean;
}

/**
 * Search cases for matching problems
 * This searches the real MongoDB cases collection
 */

type CaseUsageStats = {
  usageByCaseDbId: Map<string, number>;
  maxUsageCount: number;
};

const getEmptyCaseUsageStats = (): CaseUsageStats => ({
  usageByCaseDbId: new Map<string, number>(),
  maxUsageCount: 0,
});

const fetchCaseUsageStats = async (token: string | null): Promise<CaseUsageStats> => {
  if (!token) return getEmptyCaseUsageStats();

  try {
    const response = await fetch('/api/cases/usage-counts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return getEmptyCaseUsageStats();
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      return getEmptyCaseUsageStats();
    }

    const usageByCaseDbId = new Map<string, number>();
    let maxUsageCount = 0;

    data.data.forEach((entry: any) => {
      const caseDbId = String(entry?.caseDbId || '');
      const usageCount = Number(entry?.usageCount || 0);
      if (!caseDbId || !Number.isFinite(usageCount) || usageCount < 0) return;
      usageByCaseDbId.set(caseDbId, usageCount);
      if (usageCount > maxUsageCount) {
        maxUsageCount = usageCount;
      }
    });

    return { usageByCaseDbId, maxUsageCount };
  } catch {
    return getEmptyCaseUsageStats();
  }
};
export async function searchKnowledgeBase(
  problemDescription: string,
  weights?: MatchingWeightsOptions
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
    const token = localStorage.getItem('token');
    const response = await fetch('/api/cases', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
    const caseUsageStats = await fetchCaseUsageStats(token);
    const bestMatch = findBestMatchInCases(problemDescription, cases, weights, caseUsageStats);

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
  cases: any[],
  weights?: MatchingWeightsOptions,
  caseUsageStats: CaseUsageStats = getEmptyCaseUsageStats()
): KnowledgeSearchResult {
  const normalizeForMatching = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:()[\]{}،؛؟]/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((token) => token.replace(/^ال(?=.)/, ''))
      .join(' ');
  };

  const normalizedUserDesc = normalizeForMatching(userDescription);
  const keywordMatchWeight = Math.max(0, Math.min(100, Number(weights?.keywordMatchWeight ?? 100)));
  const caseUsageFrequencyWeight = Math.max(0, Math.min(100, Number(weights?.caseUsageFrequencyWeight ?? 0)));
  const caseFreshnessWeight = Math.max(0, Math.min(100, Number(weights?.caseFreshnessWeight ?? 0)));
  const caseMetadataMatchWeight = Math.max(0, Math.min(100, Number(weights?.caseMetadataMatchWeight ?? 0)));
  const keywordWeightMultiplier = keywordMatchWeight / 100; // 100 = full keyword influence (current only method)
  const caseUsageWeightMultiplier = caseUsageFrequencyWeight / 100;
  const caseFreshnessWeightMultiplier = caseFreshnessWeight / 100;
  const caseMetadataWeightMultiplier = caseMetadataMatchWeight / 100;
  const userWords = normalizedUserDesc.split(' ').filter(Boolean);
  const userWordSet = new Set(userWords);
  const uniqueUserWords = Array.from(userWordSet);
  const normalizedUserDescPadded = ` ${normalizedUserDesc} `;

  const normalizedUserTypeHint = normalizeForMatching(weights?.userTypeHint || '');
  const normalizedCategoryHint = normalizeForMatching(weights?.categoryHint || '');
  const normalizedSubCategoryHint = normalizeForMatching(weights?.subCategoryHint || '');
  const includeDebugBreakdown = Boolean(weights?.includeDebugBreakdown);

  let bestMatch = {
    problem: null as any,
    matchPercentage: 0,
    debugBreakdown: undefined as KnowledgeSearchResult['debugBreakdown'],
  };
  const caseCreatedAtMsList = cases
    .map((caseItem) => new Date(caseItem?.createdAt || caseItem?.updatedAt || 0).getTime())
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0);
  const minCaseCreatedAtMs = caseCreatedAtMsList.length > 0 ? Math.min(...caseCreatedAtMsList) : 0;
  const maxCaseCreatedAtMs = caseCreatedAtMsList.length > 0 ? Math.max(...caseCreatedAtMsList) : 0;

  cases.forEach((caseItem) => {
    let matchedCount = 0;

    // Get all keywords from case (mainKeywords, extraKeywords, synonyms)
    const mainKeywords = caseItem.mainKeywords ? caseItem.mainKeywords.split(/[،,]/).map((k: string) => k.trim()) : [];
    const extraKeywords = caseItem.extraKeywords ? caseItem.extraKeywords.split(/[،,]/).map((k: string) => k.trim()) : [];
    const synonyms = caseItem.synonyms ? caseItem.synonyms.split(/[،,]/).map((k: string) => k.trim()) : [];
    const negativeKeywords = caseItem.negativeKeywords ? caseItem.negativeKeywords.split(/[،,]/).map((k: string) => k.trim()) : [];
    
    const allKeywords = [...mainKeywords, ...extraKeywords, ...synonyms];
    const normalizedSingleTokenKeywords = Array.from(
      new Set(
        allKeywords
          .map((keyword: string) => normalizeForMatching(keyword))
          .filter((keyword: string) => keyword && !keyword.includes(' '))
      )
    ).sort((a, b) => b.length - a.length);
    
    // Build searchable text
    const searchableText = normalizeForMatching(allKeywords.join(' '));
    const searchableTextPadded = ` ${searchableText} `;

    const segmentTokenByKnownKeywords = (token: string): string[] | null => {
      if (!token || normalizedSingleTokenKeywords.length === 0) return null;
      const memo = new Map<number, string[] | null>();

      const segmentFrom = (startIndex: number): string[] | null => {
        if (startIndex === token.length) return [];
        if (memo.has(startIndex)) return memo.get(startIndex)!;

        for (const keyword of normalizedSingleTokenKeywords) {
          if (!keyword || !token.startsWith(keyword, startIndex)) continue;
          const rest = segmentFrom(startIndex + keyword.length);
          if (rest) {
            const segmentation = [keyword, ...rest];
            memo.set(startIndex, segmentation);
            return segmentation;
          }
        }

        memo.set(startIndex, null);
        return null;
      };

      return segmentFrom(0);
    };

    const segmentedKeywordMatches = new Set<string>();
    uniqueUserWords.forEach((word) => {
      const segmented = segmentTokenByKnownKeywords(word);
      if (segmented && segmented.length > 1) {
        segmented.forEach((segment) => segmentedKeywordMatches.add(segment));
      }
    });

    const hasExactKeywordMatch = (keyword: string): boolean => {
      const normalizedKeyword = normalizeForMatching(keyword);
      if (!normalizedKeyword) return false;

      // Phrase keyword: exact phrase match
      if (normalizedKeyword.includes(' ')) {
        return normalizedUserDescPadded.includes(` ${normalizedKeyword} `);
      }

      // Single-token keyword: exact token match
      return userWordSet.has(normalizedKeyword) || segmentedKeywordMatches.has(normalizedKeyword);
    };

    // Check for negative keywords first (if any match, skip this case)
    let hasNegativeMatch = false;
    negativeKeywords.forEach((negKeyword: string) => {
      if (negKeyword && hasExactKeywordMatch(negKeyword)) {
        hasNegativeMatch = true;
      }
    });

    if (hasNegativeMatch) {
      return; // Skip this case
    }

    // Check main keywords (highest weight)
    mainKeywords.forEach((keyword: string) => {
      if (!keyword) return;
      if (hasExactKeywordMatch(keyword)) {
        matchedCount += 3; // Main keywords have highest weight
      }
    });

    // Check extra keywords (medium weight)
    extraKeywords.forEach((keyword: string) => {
      if (!keyword) return;
      if (hasExactKeywordMatch(keyword)) {
        matchedCount += 2;
      }
    });

    // Check synonyms (lower weight)
    synonyms.forEach((synonym: string) => {
      if (!synonym) return;
      if (hasExactKeywordMatch(synonym)) {
        matchedCount += 1.5;
      }
    });

    // Also check if user description words appear in searchable text
    uniqueUserWords.forEach((word) => {
      if (word.length > 2 && searchableTextPadded.includes(` ${word} `)) {
        matchedCount += 0.5;
      }
    });

    // Calculate percentage
    const totalPossibleMatches = Math.max((mainKeywords.length * 3) + (extraKeywords.length * 2) + (synonyms.length * 1.5), userWords.length);
    const rawPercentage = totalPossibleMatches > 0 ? (matchedCount / totalPossibleMatches) * 100 : 0;
    // Ensure weighting is applied to a bounded base score, so weight (e.g. 55) is the ceiling.
    const boundedRawPercentage = Math.min(100, rawPercentage);
    const keywordContribution = boundedRawPercentage * keywordWeightMultiplier;

    const caseDbId = String(caseItem._id || caseItem.id || '');
    const usageCount = caseDbId ? (caseUsageStats.usageByCaseDbId.get(caseDbId) || 0) : 0;
    const effectiveUsageCount = usageCount > 0
      ? usageCount
      : (cases.length === 1 ? caseUsageStats.maxUsageCount : 0);
    const usageFrequencyScore = caseUsageStats.maxUsageCount > 0
      ? (effectiveUsageCount / caseUsageStats.maxUsageCount) * 100
      : (cases.length === 1 ? 100 : 0);
    const boundedUsageFrequencyScore = Math.min(100, usageFrequencyScore);
    const usageContribution = boundedUsageFrequencyScore * caseUsageWeightMultiplier;
    const caseCreatedAtMs = new Date(caseItem?.createdAt || caseItem?.updatedAt || 0).getTime();
    const freshnessScore = Number.isFinite(caseCreatedAtMs) && caseCreatedAtMs > 0
      ? (
          maxCaseCreatedAtMs > minCaseCreatedAtMs
            ? ((caseCreatedAtMs - minCaseCreatedAtMs) / (maxCaseCreatedAtMs - minCaseCreatedAtMs)) * 100
            : 100
        )
      : 0;
    const boundedFreshnessScore = Math.min(100, Math.max(0, freshnessScore));
    const freshnessContribution = boundedFreshnessScore * caseFreshnessWeightMultiplier;
    const normalizedCaseUserType = normalizeForMatching(caseItem.userType || '');
    const normalizedCaseAccountStatus = normalizeForMatching(caseItem.accountStatus || '');
    const normalizedCaseCategory = normalizeForMatching(caseItem.category || '');
    const normalizedCaseSubCategory = normalizeForMatching(caseItem.subCategory || '');

    const isHintMatched = (hint: string, candidate: string): boolean => {
      if (!hint || !candidate) return false;
      return candidate === hint || candidate.includes(hint) || hint.includes(candidate);
    };

    const getKeywordCoverageScore = (candidate: string): number => {
      const tokens = candidate.split(' ').map((token) => token.trim()).filter(Boolean);
      if (tokens.length === 0) return 0;
      const matchedTokens = tokens.filter((token) => userWordSet.has(token)).length;
      return (matchedTokens / tokens.length) * 100;
    };

    const profileComponentScores: number[] = [];
    let userTypeScore: number | null = null;
    let categoryScore: number | null = null;
    let subCategoryScore: number | null = null;
    const hasUserTypeHints = Boolean(normalizedUserTypeHint);
    if (hasUserTypeHints) {
      const userTypeMatched =
        isHintMatched(normalizedUserTypeHint, normalizedCaseUserType) ||
        isHintMatched(normalizedUserTypeHint, normalizedCaseAccountStatus);
      userTypeScore = userTypeMatched ? 100 : 0;
      profileComponentScores.push(userTypeScore);
    }
    if (normalizedCaseCategory) {
      const categoryFromDescriptionScore = getKeywordCoverageScore(normalizedCaseCategory);
      const categoryHintBoost = normalizedCategoryHint && isHintMatched(normalizedCategoryHint, normalizedCaseCategory)
        ? 100
        : 0;
      categoryScore = Math.max(categoryFromDescriptionScore, categoryHintBoost);
      profileComponentScores.push(categoryScore);
    }
    if (normalizedCaseSubCategory) {
      const subCategoryFromDescriptionScore = getKeywordCoverageScore(normalizedCaseSubCategory);
      const subCategoryHintBoost = normalizedSubCategoryHint && isHintMatched(normalizedSubCategoryHint, normalizedCaseSubCategory)
        ? 100
        : 0;
      subCategoryScore = Math.max(subCategoryFromDescriptionScore, subCategoryHintBoost);
      profileComponentScores.push(subCategoryScore);
    }

    const caseMetadataMatchScore = profileComponentScores.length > 0
      ? (profileComponentScores.reduce((sum, score) => sum + score, 0) / profileComponentScores.length)
      : 0;
    const boundedCaseMetadataMatchScore = Math.min(100, caseMetadataMatchScore);
    const metadataContribution = boundedCaseMetadataMatchScore * caseMetadataWeightMultiplier;

    const weightedPercentage = keywordContribution + usageContribution + freshnessContribution + metadataContribution;
    const matchPercentage = Math.min(100, Math.round(weightedPercentage));

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
        debugBreakdown: includeDebugBreakdown ? {
          caseDbId,
          caseId: caseItem.caseId || '',
          keyword: {
            rawScore: rawPercentage,
            boundedScore: boundedRawPercentage,
            weight: keywordMatchWeight,
            contribution: keywordContribution,
          },
          usageFrequency: {
            score: boundedUsageFrequencyScore,
            weight: caseUsageFrequencyWeight,
            contribution: usageContribution,
          },
          freshness: {
            score: boundedFreshnessScore,
            weight: caseFreshnessWeight,
            contribution: freshnessContribution,
            createdAt: caseItem?.createdAt || caseItem?.updatedAt || null,
          },
          metadata: {
            overallScore: boundedCaseMetadataMatchScore,
            weight: caseMetadataMatchWeight,
            contribution: metadataContribution,
            userTypeScore,
            categoryScore,
            subCategoryScore,
          },
          finalScore: matchPercentage,
        } : undefined,
      };
    }
  });

  return {
    problem: bestMatch.problem,
    matchPercentage: bestMatch.matchPercentage,
    isMatched: bestMatch.matchPercentage > 40, // 40% threshold
    debugBreakdown: bestMatch.debugBreakdown,
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
  const entityTypeArabic = entityType?.trim() || 'غير محدد';

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
  useMockAsFallback: boolean = false, // Ignored - kept for backward compatibility
  weights?: MatchingWeightsOptions
): Promise<KnowledgeSearchResult> {
  // Search real database only
  const result = await searchKnowledgeBase(problemDescription, weights);

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
