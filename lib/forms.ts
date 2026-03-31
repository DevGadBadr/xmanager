export function getFormValue(
  formData: FormData,
  key: string,
  fallback = "",
) {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}
