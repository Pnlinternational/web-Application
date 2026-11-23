/** Text of the elements an input points at with aria-describedby (its description and error). */
export function describedText(element: HTMLElement) {
  const ids = element.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
  return ids
    .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
    .join(" ")
    .trim();
}
