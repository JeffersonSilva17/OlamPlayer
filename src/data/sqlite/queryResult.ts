type QueryRows<Row> = {
  results?: Row[];
  rows?: { _array?: Row[] };
};

export function getResultRows<Row>(result: QueryRows<Row> | null | undefined): Row[] {
  if (!result) return [];
  if (Array.isArray(result.results)) return result.results;
  const fallback = result.rows?._array;
  return Array.isArray(fallback) ? fallback : [];
}
