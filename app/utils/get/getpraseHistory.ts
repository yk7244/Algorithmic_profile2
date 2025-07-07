export function getParseHistory() {
    const parseHistory = localStorage.getItem("parseHistory");
    return parseHistory ? JSON.parse(parseHistory) : null;
}