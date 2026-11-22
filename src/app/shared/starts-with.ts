export function startsWithFilter<T>(
  list: T[],
  searchText: string,
  field: (element: T) => string,
): T[] {
  const search = searchText.trim().toLowerCase();
  if (!search) {
    return list;
  }
  return list.filter((element) => field(element).toLowerCase().startsWith(search));
}
