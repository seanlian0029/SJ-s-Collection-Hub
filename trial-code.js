// ==================== TRIAL SECTION CODE ====================

// Load TRIAL section
async function loadTrial() {
    const trialGrid = document.getElementById('trialGrid');
    if (!trialGrid) {
        console.error('Trial grid not found');
        return;
    }

    console.log('Loading trial...');
    const trials = await fetchSheetData('TRIAL');
    
    console.log('Trial data:', trials);
    
    trialGrid.innerHTML = '';
    
    if (trials.length === 0) {
        console.log('No trial items found');
        trialGrid.innerHTML = '<p style="color: red;">No trial items found</p>';
        return;
    }

    // Create cards for each trial item
    trials.forEach((row) => {
        // TRIAL sheet: A=ID, B=TITLE, C=DESCRIPTION, D=PICTURE, E=LINK, F=OTHER DESCRIPTION, G=MESSENGER
        if (row.values[0] && row.values[1] && row.values[3]) {
            const id = row.values[0];
            const title = row.values[1];
            const description = row.values[2];
            const picture = row.values[3];
            const link = row.values[4];
            const otherDescription = row.values[5];
            const messengerLink = row.values[6];
            
            console.log('Creating trial card:', { id, title, description, picture, link, otherDescription, messengerLink });
            
            const card = document.createElement('div');
            card.className = 'trial-card';
            
            card.innerHTML = `
                <img src="${picture}" alt="${title}" class="trial-card-image" onerror="this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(title)}'">
                <div class="trial-card-content">
                    <h3 class="trial-card-title">${title}</h3>
                    <p class="trial-card-description">${description}</p>
                    <button class="trial-card-button" onclick="openTrialModal('${encodeURIComponent(JSON.stringify({id, title, description, picture, link, otherDescription, messengerLink}))}')">Play</button>
                </div>
            `;
            trialGrid.appendChild(card);
        }
    });
}

// Open trial modal popup
function openTrialModal(data) {
    console.log('Opening trial modal with data:', data);
    
    const trialData = JSON.parse(decodeURIComponent(data));
    const { id, title, description, picture, link, otherDescription, messengerLink } = trialData;
    
    const modal = document.getElementById('trialModal');
    if (!modal) {
        console.error('Trial modal not found');
        return;
    }
    
    console.log('Trial data parsed:', trialData);
    
    // Populate modal content
    document.getElementById('trialPicture').src = picture;
    document.getElementById('trialPicture').onerror = function() {
        this.src = 'https://via.placeholder.com/400x500?text=No+Image';
    };
    
    document.getElementById('trialTitle').textContent = title;
    document.getElementById('trialDescription').textContent = description;
    document.getElementById('trialWarning').textContent = otherDescription;
    
    // Set button links
    document.getElementById('buyTrialBtn').href = messengerLink;
    
    // Store video link for play button
    window.trialVideoLink = link;
    
    console.log('Modal content set. Video link:', window.trialVideoLink);
    
    // Show modal
    modal.style.display = 'flex';
}

// Play trial video
function playTrialVideo() {
    console.log('Play trial video clicked. Link:', window.trialVideoLink);
    
    if (!window.trialVideoLink) {
        alert('No video link available');
        return;
    }
    
    try {
        // Check if it's a Google Drive link
        if (window.trialVideoLink.includes('drive.google.com')) {
            const fileId = window.trialVideoLink.split('/d/')[1].split('/')[0];
            const embedLink = `https://drive.google.com/file/d/${fileId}/preview`;
            window.open(embedLink, '_blank');
        } else {
            // For other links, open directly
            window.open(window.trialVideoLink, '_blank');
        }
    } catch (error) {
        console.error('Error playing video:', error);
        // Fallback: open link directly
        window.open(window.trialVideoLink, '_blank');
    }
}

// Close trial modal
function closeTrialModal() {
    const modal = document.getElementById('trialModal');
    if (modal) {
        modal.style.display = 'none';
        window.trialVideoLink = null;
    }
    console.log('Trial modal closed');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('trialModal');
    if (event.target === modal) {
        closeTrialModal();
    }
});