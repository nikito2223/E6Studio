const GITHUB_REPO = "nikito2223/E6Studio"; // ← замени на своё
const RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Получает данные последнего релиза с GitHub
 * @returns {Promise<{ version: string, changelog: string[], published_at: string }>}
 */
export async function checkForUpdates() {
  try {
    const res = await fetch(RELEASE_API);
    if (!res.ok) throw new Error("Не удалось получить данные релиза");

    const data = await res.json();

    return {
      version: data.tag_name.replace(/^v/, ""), // v2.1.0 → 2.1.0
      changelog: data.body.split("\n").filter(line => line.trim().startsWith("-")).map(line => line.replace(/^- /, "")),
      published_at: data.published_at
    };
  } catch (err) {
    console.error("Ошибка при проверке обновлений:", err);
    return null;
  }
}
