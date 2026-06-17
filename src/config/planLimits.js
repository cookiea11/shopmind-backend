const PLAN_ANALYSIS_LIMITS = {
  starter:25,
  growth: 50,
  pro: 100,
  agency: Infinity,
};

export function getAnalysisLimit(plan) {
  return PLAN_ANALYSIS_LIMITS[plan] ?? PLAN_ANALYSIS_LIMITS.starter;
}