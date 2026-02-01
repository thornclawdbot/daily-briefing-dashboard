// Daily Briefing Dashboard - Enhanced JavaScript

// Web Search Utility (DuckDuckGo Lite - Free, No API Key)
const WebSearch = {
    /**
     * Search the web - returns web pages
     */
    async search(query, maxResults = 5) {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const html = await response.text();
            return this.parseResults(html, maxResults);
        } catch (error) {
            console.error('Web search failed:', error);
            return [];
        }
    },
    
    /**
     * Search for videos - returns YouTube, TikTok, Vimeo links
     */
    async searchVideos(query, maxResults = 5) {
        const encodedQuery = encodeURIComponent(query + " video tutorial");
        const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const html = await response.text();
            const results = this.parseResults(html, maxResults * 2);
            
            return results.filter(r => 
                r.url.includes('youtube.com') ||
                r.url.includes('youtu.be') ||
                r.url.includes('tiktok.com') ||
                r.url.includes('vimeo.com')
            ).slice(0, maxResults);
        } catch (error) {
            console.error('Video search failed:', error);
            return [];
        }
    },
    
    /**
     * Search for images - returns Unsplash/Pexels direct URLs
     */
    async searchImages(query, maxResults = 5) {
        const images = [];
        
        images.push({
            title: `Unsplash: ${query}`,
            url: `https://unsplash.com/search?q=${encodeURIComponent(query)}`,
            source: 'Unsplash'
        });
        
        images.push({
            title: `Pexels: ${query}`,
            url: `https://www.pexels.com/search/${encodeURIComponent(query)}/`,
            source: 'Pexels'
        });
        
        images.push({
            title: `Pixabay: ${query}`,
            url: `https://pixabay.com/en/images/search/${encodeURIComponent(query)}/`,
            source: 'Pixabay'
        });
        
        return images;
    },
    
    /**
     * Search for YouTube tutorials specifically
     */
    async searchYouTube(query, maxResults = 5) {
        const encodedQuery = encodeURIComponent(query + " tutorial");
        const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const html = await response.text();
            const results = this.parseResults(html, maxResults * 3);
            
            return results.filter(r => 
                r.url.includes('youtube.com') ||
                r.url.includes('youtu.be')
            ).slice(0, maxResults);
        } catch (error) {
            console.error('YouTube search failed:', error);
            return [];
        }
    },
    
    parseResults(html, maxResults) {
        const results = [];
        const lines = html.split('\n');
        let currentResult = {};
        let resultCount = 0;
        
        for (const line of lines) {
            if (line.includes('>URL<') || line.includes('result-link')) {
                currentResult = {};
            }
            
            const urlMatch = line.match(/href="([^"]+)"/);
            if (urlMatch && urlMatch[1].startsWith('http')) {
                currentResult.url = urlMatch[1];
            }
            
            const textMatches = line.match(/>([^<]{5,100})</g);
            if (textMatches && textMatches.length > 0) {
                const potentialTitle = textMatches[0].replace(/[><]/g, '').trim();
                if (potentialTitle.length > 10 && potentialTitle.length < 100 && !currentResult.title) {
                    currentResult.title = potentialTitle;
                }
            }
            
            if (currentResult.title && currentResult.url && !currentResult.snippet) {
                results.push({
                    title: currentResult.title,
                    url: currentResult.url,
                    snippet: currentResult.snippet || ''
                });
                resultCount++;
                if (resultCount >= maxResults) break;
                currentResult = {};
            }
        }
        
        return results;
    },
    
    async quickSearch(query, type = 'web') {
        let results;
        
        switch(type) {
            case 'video': results = await this.searchVideos(query, 5); break;
            case 'youtube': results = await this.searchYouTube(query, 5); break;
            case 'image': results = await this.searchImages(query, 5); break;
            default: results = await this.search(query, 5);
        }
        
        if (results.length === 0) return `No results for: "${query}"`;
        
        let output = `🔍 ${type.toUpperCase()} results for "${query}":\n\n`;
        
        if (type === 'image') {
            results.forEach((r, i) => {
                output += `${i + 1}. ${r.title} (${r.source})\n   ${r.url}\n\n`;
            });
        } else {
            results.forEach((r, i) => {
                output += `${i + 1}. ${r.title}\n   ${r.url}\n\n`;
            });
        }
        
        return output;
    }
};

// Configuration
const CONFIG = {
    githubRepo: 'thornclawdbot/daily-briefing-dashboard',
    githubBranch: 'master',
    dataPath: 'data',
    useLocalFiles: false,
    quotes: [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
        { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
        { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
        { text: "The only thing necessary for the triumph of evil is for good men to do nothing.", author: "Edmund Burke" },
        { text: "Yesterday is not ours to recover, but tomorrow is ours to win or lose.", author: " Lyndon B. Johnson" },
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" }
    ]
};

// State
let state = {
    briefing: null,
    posts: [],
    tiktok: null,
    stocks: null,
    crypto: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    loadAllData();
    loadNotes();
    displayRandomQuote();
    startAutoRefresh();
    loadTheme();
});

// Set current date
function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
}

// Load all data
async function loadAllData() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => el.textContent = 'Loading...');

    try {
        const today = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[today.getMonth()];
        const year = today.getFullYear();
        const dateStr = today.toISOString().split('T')[0];
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDate = `${dayName}-${dateStr}`;

        await loadBriefing(month, year, shortDate);
        await loadSocialPosts(month, year, shortDate);
        await loadTikTok(month, year, shortDate);
        await loadMarketData();
        updateTimestamp();

    } catch (error) {
        console.error('Error loading data:', error);
        loadingElements.forEach(el => el.textContent = 'No data available');
    }
}

// GitHub raw URL helper
function getRawUrl(path) {
    return `https://raw.githubusercontent.com/${CONFIG.githubRepo}/${CONFIG.githubBranch}/${path}`;
}

// Load briefing
async function loadBriefing(month, year, shortDate) {
    const paths = [
        `${CONFIG.dataPath}/briefings/${month}-${year}/Week-*/${shortDate}.md`,
        `${CONFIG.dataPath}/briefings/${month}-${year}/${shortDate}.md`
    ];

    let content = null;
    
    for (const pattern of paths) {
        try {
            const url = getRawUrl(pattern);
            const response = await fetch(url);
            if (response.ok) {
                content = await response.text();
                break;
            }
        } catch (e) {
            continue;
        }
    }

    if (content) {
        parseAndRenderBriefing(content);
    }
}

// Parse and render briefing
function parseAndRenderBriefing(content) {
    const topics = [];
    const lines = content.split('\n');
    let currentTopic = null;

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentTopic) topics.push(currentTopic);
            currentTopic = {
                title: line.replace('## ', '').trim(),
                icon: getTopicIcon(line),
                preview: ''
            };
        } else if (line.startsWith('### ') && currentTopic) {
            currentTopic.preview = line.replace('### ', '').trim();
        }
    }
    if (currentTopic) topics.push(currentTopic);

    const container = document.getElementById('briefing-content');
    container.innerHTML = topics.length > 0 ? `
        <div class="briefing-summary">
            ${topics.map(topic => `
                <div class="briefing-topic">
                    <span class="briefing-icon">${topic.icon}</span>
                    <div class="briefing-info">
                        <div class="briefing-title">${topic.title}</div>
                        <div class="briefing-preview">${topic.preview || 'Click View All to read more'}</div>
                    </div>
                    <a href="https://daily-briefing-thorn.netlify.app/briefings.html" class="briefing-more">View →</a>
                </div>
            `).join('')}
        </div>
    ` : `<div class="loading">No briefing available. Check back at 6 AM!</div>`;
}

// Get topic icon
function getTopicIcon(title) {
    const icons = {
        'SPORTS': '🏈', 'TECH': '💻', 'TRAVEL': '✈️', 'FASHION': '👗',
        'LITERATURE': '📚', 'BOOKS': '📚', 'HEARING': '👂', 'CONTENT': '🎙️',
        'STOCK': '📈', 'CRYPTO': '🪙', 'NEWS': '📰', 'WEATHER': '🌤️'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (title.toUpperCase().includes(key)) return icon;
    }
    return '📰';
}

// Load social posts
async function loadSocialPosts(month, year, shortDate) {
    const paths = [
        `${CONFIG.dataPath}/posts/${month}-${year}/Week-*/${shortDate}.csv`,
        `${CONFIG.dataPath}/posts/${month}-${year}/${shortDate}.csv`
    ];

    let posts = [];
    
    for (const pattern of paths) {
        try {
            const url = getRawUrl(pattern);
            const response = await fetch(url);
            if (response.ok) {
                const csv = await response.text();
                posts = parseCSV(csv);
                break;
            }
        } catch (e) {
            continue;
        }
    }

    renderSocialPosts(posts);
}

// Parse CSV
function parseCSV(csv) {
    const lines = csv.split('\n');
    const posts = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle quoted values
        const match = line.match(/^"?([^"]*)"?,[^,]*,[^,]*,"?([^"]*)"?/);
        if (match) {
            posts.push({
                time: match[2]?.trim() || '12:00',
                text: match[1]?.split(',')[0] || match[1],
                status: 'draft'
            });
        }
    }
    
    return posts;
}

// Render social posts
function renderSocialPosts(posts) {
    const container = document.getElementById('social-content');
    document.getElementById('post-count').textContent = `${posts.length} posts`;
    
    if (posts.length === 0) {
        container.innerHTML = `<div class="loading">No social posts for today yet. Check back at 6 PM!</div>`;
        return;
    }

    container.innerHTML = `
        <div class="posts-list">
            ${posts.map(post => `
                <div class="post-item">
                    <span class="post-time">${post.time}</span>
                    <span class="post-text">${post.text.substring(0, 100)}${post.text.length > 100 ? '...' : ''}</span>
                    <span class="post-status">${post.status}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Load TikTok content
async function loadTikTok(month, year, shortDate) {
    const paths = [
        `${CONFIG.dataPath}/tiktok/${month}-${year}/Week-*/${shortDate}.md`,
        `${CONFIG.dataPath}/tiktok/${month}-${year}/${shortDate}.md`
    ];

    let content = null;
    
    for (const pattern of paths) {
        try {
            const url = getRawUrl(pattern);
            const response = await fetch(url);
            if (response.ok) {
                content = await response.text();
                break;
            }
        } catch (e) {
            continue;
        }
    }

    renderTikTok(content);
}

// Render TikTok content
function renderTikTok(content) {
    const container = document.getElementById('tiktok-content');
    
    if (!content) {
        container.innerHTML = `<div class="loading">No TikTok content for today yet. Check back at 9 AM!</div>`;
        return;
    }

    const scriptMatch = content.match(/### 📝 SCRIPT[\s\S]*?(?=###|$)/i);
    const captionMatch = content.match(/### #️⃣ CAPTION[\s\S]*?(?=###|$)/i);
    const promptMatch = content.match(/### 📸 IMAGE PROMPT[\s\S]*?(?=###|$)/i);

    const script = scriptMatch ? scriptMatch[0].replace(/### 📝 SCRIPT/i, '').trim() : '';
    const caption = captionMatch ? captionMatch[0].replace(/#️⃣ CAPTION/i, '').trim() : '';
    const prompt = promptMatch ? promptMatch[0].replace(/### 📸 IMAGE PROMPT/i, '').trim() : '';

    container.innerHTML = `
        <div class="tiktok-content">
            ${script ? `<div class="tiktok-section"><h4>📝 Script</h4><p>${script.substring(0, 200)}${script.length > 200 ? '...' : ''}</p></div>` : ''}
            ${caption ? `<div class="tiktok-section"><h4>#️⃣ Caption</h4><p>${caption.substring(0, 150)}${caption.length > 150 ? '...' : ''}</p></div>` : ''}
            ${prompt ? `<div class="tiktok-section"><h4>📸 Image Prompt</h4><p>${prompt.substring(0, 150)}${prompt.length > 150 ? '...' : ''}</p></div>` : ''}
        </div>
    `;
}

// Load market data
async function loadMarketData() {
    updateMarketDisplay();
    updateWeatherDisplay();
}

// Update market display
function updateMarketDisplay() {
    // Placeholder data - would be replaced with actual API calls
    const stocks = [
        { symbol: 'S&P 500', price: '5,892.63', change: '+0.45%' },
        { symbol: 'NASDAQ', price: '19,512.84', change: '+0.62%' },
        { symbol: 'Bitcoin', price: '$92,450', change: '+2.3%' },
        { symbol: 'Ethereum', price: '$3,180', change: '+1.8%' }
    ];

    stocks.forEach(stock => {
        const changeEl = document.getElementById(stock.symbol === 'S&P 500' ? 'sp500-change' : 
                                                   stock.symbol === 'NASDAQ' ? 'nasdaq-change' :
                                                   stock.symbol === 'Bitcoin' ? 'btc-change' : 'eth-change');
        const priceEl = document.getElementById(stock.symbol === 'S&P 500' ? 'sp500' : 
                                                 stock.symbol === 'NASDAQ' ? 'nasdaq' :
                                                 stock.symbol === 'Bitcoin' ? 'btc-price' : 'eth-price');
        
        if (priceEl) priceEl.textContent = stock.price;
        if (changeEl) {
            changeEl.textContent = stock.change;
            changeEl.className = 'ticker-change ' + (stock.change.startsWith('+') ? 'positive' : 'negative');
        }
    });
}

// Update weather display
function updateWeatherDisplay() {
    const weatherData = {
        temp: '72°',
        condition: 'Sunny',
        humidity: '45%',
        wind: '8 mph',
        location: 'Los Angeles'
    };

    document.getElementById('weather-temp').innerHTML = `${weatherData.temp}<span class="weather-location">${weatherData.location}</span>`;
    document.getElementById('weather-humidity').textContent = weatherData.humidity;
    document.getElementById('weather-wind').textContent = weatherData.wind;
    document.getElementById('weather-condition').textContent = weatherData.condition;
}

// Display random quote
function displayRandomQuote() {
    const quote = CONFIG.quotes[Math.floor(Math.random() * CONFIG.quotes.length)];
    document.getElementById('daily-quote').textContent = `"${quote.text}"`;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
}

// Theme toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.getElementById('theme-icon');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Load theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Notes functionality
function loadNotes() {
    const savedNotes = localStorage.getItem('quickNotes') || '';
    document.getElementById('quick-notes').value = savedNotes;
}

function saveNotes() {
    const notes = document.getElementById('quick-notes').value;
    localStorage.setItem('quickNotes', notes);
    alert('Notes saved!');
}

// Open folder
function openFolder(folderName) {
    const paths = {
        'daily-briefings': 'C:/Users/thorn/OneDrive/Documents/clawdbot/daily-briefings',
        'buffer-posts': 'C:/Users/thorn/OneDrive/Documents/clawdbot/buffer-posts',
        'tiktok-content': 'C:/Users/thorn/OneDrive/Documents/clawdbot/tiktok-content',
        'cold-case-christianity': 'C:/Users/thorn/OneDrive/Documents/clawdbot/cold-case-christianity',
        'journal': 'C:/Users/thorn/OneDrive/Documents/Journal',
        'memory': 'C:/Users/thoms/clawd/memory',
        'daily-briefing-dashboard': 'C:/Users/thorn/OneDrive/Documents/clawdbot/daily-briefing-dashboard'
    };
    
    const path = paths[folderName];
    if (path) {
        // Try to open in file explorer
        const success = window.open(`file://${path}`, '_blank');
        if (!success || success.closed) {
            // If popup blocked, show the path
            alert(`Open this folder:\n${path}`);
        }
    }
}

// Refresh data
function refreshData() {
    loadAllData();
    displayRandomQuote();
}

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    document.getElementById('last-updated').textContent = now.toLocaleTimeString();
}

// Auto refresh every 5 minutes
function startAutoRefresh() {
    setInterval(() => {
        loadAllData();
    }, 5 * 60 * 1000);
}
