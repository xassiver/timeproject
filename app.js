/**
 * REPOSITORY CONFIGURATION
 * Change these values to point to a different repository.
 */
const CONFIG = {
    GITHUB_USER: 'xassiver',
    REPO_NAME: 'timeproject'
};

const contentDiv = document.getElementById('content');
const repoLinkElement = document.getElementById('repo-link');

// Update UI text based on configuration
function initializeUI() {
    document.title = `${CONFIG.REPO_NAME} / releases - xassiver`;
    repoLinkElement.textContent = CONFIG.REPO_NAME;
    repoLinkElement.href = `https://github.com/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}`;
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
                    <div class="release-name">${release.name || release.tag_name}</div>
                    <span class="release-tag">${release.tag_name}</span>
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
                            ${older.map((r, i) => `<option value="${i}">${r.tag_name} - ${formatDate(r.published_at)}</option>`).join('')}
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
 * Basic markdown parsing for the release body
 */
function parseMarkdownBasic(text) {
    if (!text) return 'Açıklama belirtilmemiş.';
    
    return text
        .replace(/### (.*)/g, '<h3 style="color: var(--text-primary); margin: 1rem 0 0.5rem 0;">$1</h3>')
        .replace(/## (.*)/g, '<h2 style="color: var(--text-primary); margin: 1.2rem 0 0.6rem 0;">$1</h2>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)/gm, '• $1')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    fetchReleases();
});