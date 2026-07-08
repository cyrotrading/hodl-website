// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Info Bar Copy Functionality
const infoItem = document.querySelector('.info-item[data-full-address]');
const copyTooltip = document.querySelector('.copy-tooltip');

if (infoItem) {
    infoItem.addEventListener('click', async () => {
        const fullAddress = infoItem.getAttribute('data-full-address');
        
        try {
            await navigator.clipboard.writeText(fullAddress);
            copyTooltip.classList.add('show');
            
            setTimeout(() => {
                copyTooltip.classList.remove('show');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });
}

// TODO: Set TOKEN_MINT and HELIUS_API_KEY once new CA is live
const TOKEN_MINT = null;
const HELIUS_API_KEY = null;
const UPDATE_INTERVAL = 15000; // 15 seconds

async function fetchMarketCap() {
    return '---';
}

async function updateMarketCap() {
    const mcapElement = document.getElementById('mcap');
    if (mcapElement) mcapElement.textContent = '---';
}

async function fetchHolderCount() {
    return null;
}

function formatNumber(num) {
    if (num === null) return '---';
    return num.toLocaleString('en-US');
}

async function updateHolderCount() {
    const holderElement = document.getElementById('holderCount');
    const holdersInfoElement = document.getElementById('holders');
    
    if (!holderElement) return;
    
    const count = await fetchHolderCount();
    holderElement.textContent = '---';
    if (count !== null) {
        const oldCount = holderElement.textContent;
        const newCount = formatNumber(count);
        
        // Update both the main holder count and info bar
        if (oldCount !== newCount) {
            holderElement.classList.add('shake');
            setTimeout(() => holderElement.classList.remove('shake'), 500);
        }
        
        holderElement.textContent = newCount;
        
        // Update info bar holders value
        if (holdersInfoElement) {
            holdersInfoElement.textContent = newCount;
        }
        
        if (oldCount !== newCount && oldCount !== '---') {
            // Trigger shake animation
            holderElement.classList.add('shake');
            setTimeout(() => {
                holderElement.classList.remove('shake');
            }, 500);
        }
        
        holderElement.textContent = newCount;
    }
}

// Initial fetch
updateHolderCount();
updateMarketCap();

// Update every 15 seconds
setInterval(updateHolderCount, UPDATE_INTERVAL);
setInterval(updateMarketCap, UPDATE_INTERVAL);

// Carousel functionality
let currentSlide = 0;
const track = document.querySelector('.carousel-track');
const slides = document.querySelectorAll('.carousel-item');
const totalSlides = slides.length;
const slidesToShow = 3;

function moveCarousel(direction) {
    currentSlide += direction;
    
    // Loop around
    if (currentSlide < 0) {
        currentSlide = totalSlides - slidesToShow;
    } else if (currentSlide > totalSlides - slidesToShow) {
        currentSlide = 0;
    }
    
    updateCarousel();
}

function updateCarousel() {
    if (track) {
        const offset = -currentSlide * (100 / slidesToShow);
        track.style.transform = `translateX(${offset}%)`;
    }
}

// Auto-play carousel - slower rotation
let autoPlayInterval = setInterval(() => {
    moveCarousel(1);
}, 3000);

// Reset auto-play on manual navigation
document.querySelectorAll('.carousel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            moveCarousel(1);
        }, 3000);
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe step cards
document.querySelectorAll('.step').forEach(step => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(20px)';
    step.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(step);
});
// ===========================
// LEADERBOARD FUNCTIONALITY
// ===========================

async function fetchLeaderboardData() {
    return [];
}

async function getHoldingTime(walletAddress) {
    try {
        // Get token account for this specific wallet and mint
        const requestBody = {
            jsonrpc: '2.0',
            id: 'get-token-account',
            method: 'getTokenAccountsByOwner',
            params: [
                walletAddress,
                {
                    mint: TOKEN_MINT
                },
                {
                    encoding: 'jsonParsed'
                }
            ]
        };

        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            return 'N/A';
        }

        const data = await response.json();
        
        if (data.result && data.result.value && data.result.value.length > 0) {
            const tokenAccount = data.result.value[0].pubkey;
            
            // Get signatures for this specific token account
            const sigRequestBody = {
                jsonrpc: '2.0',
                id: 'get-sigs',
                method: 'getSignaturesForAddress',
                params: [
                    tokenAccount,
                    {
                        limit: 1000
                    }
                ]
            };

            const sigResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sigRequestBody)
            });

            if (!sigResponse.ok) {
                return 'N/A';
            }

            const sigData = await sigResponse.json();
            
            if (sigData.result && sigData.result.length > 0) {
                // Get the oldest transaction (first purchase)
                const oldestTx = sigData.result[sigData.result.length - 1];
                const firstPurchaseTime = oldestTx.blockTime * 1000; // Convert to milliseconds
                const now = Date.now();
                const holdingDuration = now - firstPurchaseTime;
                
                // Convert to days and hours
                const days = Math.floor(holdingDuration / (1000 * 60 * 60 * 24));
                const hours = Math.floor((holdingDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                if (days > 0) {
                    return `${days}d ${hours}h`;
                } else if (hours > 0) {
                    return `${hours}h`;
                } else {
                    const minutes = Math.floor(holdingDuration / (1000 * 60));
                    return `${minutes}m`;
                }
            }
        }
        
        return 'N/A';
    } catch (error) {
        console.error('Error fetching holding time:', error);
        return 'N/A';
    }
}

function formatWalletAddress(address) {
    if (!address || address.length < 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatAmount(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(2) + 'M';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(2) + 'K';
    }
    return amount.toFixed(2);
}

async function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    
    if (!leaderboardBody) return;
    
    const holders = await fetchLeaderboardData();
    
    if (holders.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="4" class="leaderboard-loading">Coming soon</td></tr>';
        return;
    }
    
    leaderboardBody.innerHTML = holders.map((holder, index) => `
        <tr>
            <td>${index + 1}</td>
            <td title="${holder.wallet}">${formatWalletAddress(holder.wallet)}</td>
            <td>${formatAmount(holder.amount)} $HODL</td>
            <td>${holder.holdingTime}</td>
        </tr>
    `).join('');
}

// Initialize leaderboard on page load
document.addEventListener('DOMContentLoaded', () => {
    updateLeaderboard();
    // Refresh leaderboard every 30 seconds
    setInterval(updateLeaderboard, 30000);
});