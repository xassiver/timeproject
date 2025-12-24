import { marked } from 'https://esm.sh/marked@5';

/**
 * REPOSITORY CONFIGURATION
 * Change these values to point to a different repository.
 */
const CONFIG = {
    GITHUB_USER: 'xassiver',
    REPO_NAME: 'timepoject'
};

const contentDiv = document.getElementById('content');
const repoLinkElement = document.getElementById('repo-link');

// Update UI text based on configuration
function initializeUI() {
    // update page title to include repo name and user
    document.title = `${CONFIG.REPO_NAME} / releases - ${CONFIG.GITHUB_USER}`;
    // repo link (points to the repository)
    repoLinkElement.textContent = CONFIG.REPO_NAME;
    repoLinkElement.href = `https://github.com/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}`;

    // brand element reflects the GitHub user and links to their profile
    const brandEl = document.getElementById('brand');
    if (brandEl) {
        brandEl.textContent = CONFIG.GITHUB_USER;
        brandEl.href = `https://github.com/${CONFIG.GITHUB_USER}`;
    }
}

async function fetchReleases() {
    try {
        const response = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}/releases`);
        
        if (!response.ok) {
            if (response.status === 404) throw new Error('Repository not found or has no releases.');
            throw new Error(`GitHub API Error: ${response.status}`);
        }

        const releases = await response.json();
        renderReleases(releases);
    } catch (error) {
        contentDiv.innerHTML = `
            <div class="error-container">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Veriler alınırken bir hata oluştu.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

function createReleaseCard(release, isLatest = false) {
    const assetsHtml = release.assets.map(asset => `
        <a href="${asset.browser_download_url}" class="asset-button" title="${(asset.size / 1024 / 1024).toFixed(2)} MB">
            <i class="fa-solid fa-download"></i>
            ${asset.name}
        </a>
    `).join('');

    const sourceHtml = `
        <a href="${release.zipball_url}" class="asset-button">
            <i class="fa-solid fa-file-zipper"></i> Source (zip)
        </a>
        <a href="${release.tarball_url}" class="asset-button">
            <i class="fa-solid fa-file-zipper"></i> Source (tar.gz)
        </a>
    `;

    return `
        <div class="release-card">
            ${isLatest ? '<div class="latest-badge">Son Sürüm</div>' : ''}
            <div class="release-header">
                <div class="release-title-group">
                    <div class="release-name">${escapeHtml(release.name || release.tag_name)}</div>
                    <span class="release-tag">${escapeHtml(release.tag_name)}</span>
                </div>
                <div class="release-date">
                    <i class="fa-regular fa-calendar"></i> ${formatDate(release.published_at)}
                </div>
            </div>
            <div class="release-body">${parseMarkdownBasic(release.body)}</div>
            <div class="assets-section">
                ${assetsHtml || sourceHtml}
            </div>
        </div>
    `;
}

function renderReleases(releases) {
    if (releases.length === 0) {
        contentDiv.innerHTML = `
            <div class="loading-container">
                Henüz yayınlanmış bir sürüm bulunamadı.
            </div>
        `;
        return;
    }

    const latest = releases[0];
    const older = releases.slice(1);

    let html = `
        <div id="latest-container">
            ${createReleaseCard(latest, true)}
        </div>
    `;

    if (older.length > 0) {
        html += `
            <div class="archive-section">
                <div class="archive-controls">
                    <div class="archive-label">Önceki Sürümler / Archive</div>
                    <div class="dropdown-wrapper">
                        <select id="version-select" class="version-select">
                            <option value="" disabled selected>Bir sürüm seçin...</option>
                            ${older.map((r, i) => `<option value="${i}">${escapeHtml(r.tag_name)} - ${formatDate(r.published_at)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div id="older-release-display"></div>
            </div>
        `;
    }

    contentDiv.innerHTML = html;

    // Add listener for dropdown
    const select = document.getElementById('version-select');
    const display = document.getElementById('older-release-display');

    if (select) {
        select.addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            const selectedRelease = older[index];
            display.innerHTML = createReleaseCard(selectedRelease);
            
            // Scroll to the selected release card smoothly
            display.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

/**
 * Use marked to parse full Markdown into HTML.
 * Basic escaping helper to avoid double-inserting unescaped values
 */
function parseMarkdownBasic(text) {
    if (!text) return '<p>Açıklama belirtilmemiş.</p>';
    // marked will produce HTML; allow it directly
    return marked.parse(text);
}

// Simple escape to avoid injecting raw values into headings/tags
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    fetchReleases();
});