// Google Sheet ID
const SHEET_ID = '1YWMBr3eK-iImfjz1Ybq2mGX1p0hl6uaLTZGo3K8yYpA';
// Your API Key
const API_KEY = 'AIzaSyDkH1zxQegLXZNktHU2pXWDu0TA539RoSw';

// Function to fetch data from Google Sheet using API
async function fetchSheetData(sheetName) {
    try {
        // Fetch data from the sheet
        const range = `${sheetName}!A:H`; // Columns A to H
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values) {
            // Skip header row (row 1) and map the rest
            return data.values.slice(1).map(row => ({
                values: row
            })).filter(row => row.values[0]); // Remove empty rows
        }
        return [];
    } catch (error) {
        console.error('Error fetching data from', sheetName, ':', error);
        return [];
    }
}

// Load categories on homepage
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    console.log('Loading categories...');
    const categories = await fetchSheetData('CATEGORIES');
    
    console.log('Categories data:', categories);
    
    categoriesGrid.innerHTML = '';
    
    if (categories.length === 0) {
        categoriesGrid.innerHTML = '<p style="color: red;">No categories found. Please check your API Key and Sheet.</p>';
        return;
    }

    categories.forEach((row, index) => {
        // Skip empty rows - check if values exist
        // CATEGORIES sheet: A=ID, B=TITLE, C=DESCRIPTION, D=PICTURE
        if (row.values[0] && row.values[1]) {
            const id = row.values[0];
            const title = row.values[1];
            const description = row.values[2];
            const pictureLink = row.values[3];
            
            const card = document.createElement('div');
            card.className = 'category-card';
            
            card.innerHTML = `
                <img src="${pictureLink}" alt="${title}" class="card-image" onerror="this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(title)}'">
                <div class="card-content">
                    <h2 class="card-title">${title}</h2>
                    <p class="card-description">${description}</p>
                    <button class="card-button" onclick="goToCategory('${title}')">Browse</button>
                </div>
            `;
            categoriesGrid.appendChild(card);
        }
    });
}

// Load lists on homepage
async function loadListsOnHomepage() {
    const listGrid = document.getElementById('listGrid');
    if (!listGrid) return;

    console.log('Loading lists...');
    const lists = await fetchSheetData('LIST');
    
    console.log('Lists data:', lists);
    
    listGrid.innerHTML = '';
    
    if (lists.length === 0) {
        console.log('No lists found');
        return;
    }

    // Get unique list titles
    const uniqueLists = new Map();
    lists.forEach((row) => {
        // LIST sheet: A=ID, B=TITLE, C=DESCRIPTION, D=PICTURE
        if (row.values[0] && row.values[1]) {
            const id = row.values[0];
            const title = row.values[1];
            const description = row.values[2];
            const pictureLink = row.values[3];
            
            // Store only the first entry for each list title
            if (!uniqueLists.has(title)) {
                uniqueLists.set(title, { id, title, description, pictureLink });
            }
        }
    });

    // Create cards for each unique list
    uniqueLists.forEach((listData) => {
        const card = document.createElement('div');
        card.className = 'category-card';
        
        card.innerHTML = `
            <img src="${listData.pictureLink}" alt="${listData.title}" class="card-image" onerror="this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(listData.title)}'">
            <div class="card-content">
                <h2 class="card-title">${listData.title}</h2>
                <p class="card-description">${listData.description}</p>
                <button class="card-button" onclick="goToListView('${listData.title}')">View</button>
            </div>
        `;
        listGrid.appendChild(card);
    });
}

// Go to category page
function goToCategory(categoryName) {
    sessionStorage.setItem('selectedCategory', categoryName);
    window.location.href = 'category.html';
}

// Go to list view page
function goToListView(listName) {
    sessionStorage.setItem('selectedListView', listName);
    window.location.href = 'list.html';
}

// Load list view - shows items from ACCESS sheet filtered by list name with alphabetical grouping (NO PLAY BUTTONS)
async function loadListView() {
    const listGrid = document.getElementById('listGrid');
    if (!listGrid) return;

    const listName = sessionStorage.getItem('selectedListView');
    if (!listName) return;

    document.getElementById('listTitle').textContent = listName;

    console.log('Loading list view for:', listName);
    const accessData = await fetchSheetData('ACCESS');
    
    console.log('Access data:', accessData);
    
    listGrid.innerHTML = '';

    if (accessData.length === 0) {
        listGrid.innerHTML = '<p style="color: red;">No items found.</p>';
        return;
    }

    // Filter ACCESS sheet by category that matches listName and remove duplicates
    const seenTitles = new Set();
    const listItems = [];
    
    accessData.forEach(row => {
        // ACCESS sheet: A=CATEGORIES, B=ID, C=TITLE, D=TYPE, E=PICTURE
        const category = row.values[0];
        const id = row.values[1];
        const title = row.values[2];
        const type = row.values[3];
        const picture = row.values[4];
        
        if (category === listName && picture && !seenTitles.has(title)) {
            seenTitles.add(title);
            listItems.push({ id, title, type, picture });
        }
    });

    console.log('Items found:', listItems);

    if (listItems.length === 0) {
        listGrid.innerHTML = '<p style="color: red;">No items available in this list.</p>';
        return;
    }

    // Sort alphabetically by title
    listItems.sort((a, b) => a.title.localeCompare(b.title));

    // Group by first letter
    const groupedItems = {};
    listItems.forEach(item => {
        const firstLetter = item.title.charAt(0).toUpperCase();
        if (!groupedItems[firstLetter]) {
            groupedItems[firstLetter] = [];
        }
        groupedItems[firstLetter].push(item);
    });

    // Display grouped items with letter headers - NO PLAY BUTTONS, JUST DISPLAY
    Object.keys(groupedItems).sort().forEach(letter => {
        // Add letter header
        const letterHeader = document.createElement('div');
        letterHeader.className = 'letter-header';
        letterHeader.textContent = letter;
        listGrid.appendChild(letterHeader);

        // Add items for this letter - NO PLAY BUTTON
        groupedItems[letter].forEach(item => {
            const card = document.createElement('div');
            card.className = 'content-card';
            card.innerHTML = `
                <img src="${item.picture}" alt="${item.title}" class="card-image" onerror="this.src='https://via.placeholder.com/250x350?text=No+Image'">
                <div class="card-content">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-description">${item.type}</p>
                </div>
            `;
            listGrid.appendChild(card);
        });
    });
}

// Load content for selected category (from ACCESS sheet - no duplicates!)
async function loadCategoryContent() {
    const categoryName = sessionStorage.getItem('selectedCategory');
    if (!categoryName) return;

    document.getElementById('categoryTitle').textContent = categoryName;
    
    // Update navbar with dynamic category name
    const navLink = document.getElementById('navCategory');
    if (navLink) {
        navLink.textContent = 'MORE ' + categoryName.toUpperCase();
    }

    console.log('Loading content for category:', categoryName);
    const videos = await fetchSheetData('ACCESS');
    
    console.log('Videos data:', videos);
    
    const contentGrid = document.getElementById('contentGrid');
    contentGrid.innerHTML = '';

    if (videos.length === 0) {
        contentGrid.innerHTML = '<p style="color: red;">No videos found.</p>';
        return;
    }

    // Create a Set to track unique titles (avoid duplicates)
    const seenTitles = new Set();
    const uniqueVideos = [];

    videos.forEach(row => {
        // ACCESS sheet: A=CATEGORIES, B=ID, C=TITLE, D=TYPE, E=PICTURE
        const category = row.values[0];
        const id = row.values[1];
        const title = row.values[2];
        const type = row.values[3];
        const picture = row.values[4];
        
        // Only add if category matches and title is unique
        if (category === categoryName && title && !seenTitles.has(title)) {
            seenTitles.add(title);
            uniqueVideos.push({ category, id, title, type, picture });
        }
    });

    // Sort alphabetically by title
    uniqueVideos.sort((a, b) => a.title.localeCompare(b.title));

    // Group by first letter
    const groupedVideos = {};
    uniqueVideos.forEach(video => {
        const firstLetter = video.title.charAt(0).toUpperCase();
        if (!groupedVideos[firstLetter]) {
            groupedVideos[firstLetter] = [];
        }
        groupedVideos[firstLetter].push(video);
    });

    // Display grouped videos with letter headers
    Object.keys(groupedVideos).sort().forEach(letter => {
        // Add letter header
        const letterHeader = document.createElement('div');
        letterHeader.className = 'letter-header';
        letterHeader.textContent = letter;
        contentGrid.appendChild(letterHeader);

        // Add videos for this letter
        groupedVideos[letter].forEach(video => {
            const card = document.createElement('div');
            card.className = 'content-card';
            card.innerHTML = `
                <img src="${video.picture}" alt="${video.title}" class="card-image" onerror="this.src='https://via.placeholder.com/250x350?text=${encodeURIComponent(video.title)}'">
                <div class="card-content">
                    <h3 class="card-title">${video.title}</h3>
                    <p class="card-description">${video.type}</p>
                    <button class="card-button" onclick="goToDetails('${encodeURIComponent(JSON.stringify(video))}')">Play</button>
                </div>
            `;
            contentGrid.appendChild(card);
        });
    });
}

// Go to details page
function goToDetails(data) {
    sessionStorage.setItem('selectedContent', data);
    window.location.href = 'details.html';
}

// Load details page
async function loadDetails() {
    const contentData = sessionStorage.getItem('selectedContent');
    if (!contentData) return;
    
    const data = JSON.parse(decodeURIComponent(contentData));
    const { category, title, type, picture } = data;
    
    document.getElementById('detailsPoster').src = picture;
    document.getElementById('detailsPoster').onerror = function() {
        this.src = 'https://via.placeholder.com/350x500?text=No+Image';
    };
    
    document.getElementById('detailsTitle').textContent = title;
    document.getElementById('detailsCategory').textContent = type;
    
    // Update navbar with category link
    const navCategoryLink = document.getElementById('navCategoryLink');
    if (navCategoryLink) {
        navCategoryLink.textContent = 'MORE ' + category.toUpperCase();
        navCategoryLink.style.display = 'block';
        navCategoryLink.href = '#';
        navCategoryLink.onclick = function(e) {
            e.preventDefault();
            goToCategory(category);
        };
    }

    if (type === 'MOVIE') {
        document.getElementById('movieContainer').style.display = 'block';
        document.getElementById('seasonsContainer').style.display = 'none';
        document.getElementById('episodesContainer').style.display = 'none';
        // Fetch the video link from DATABASE sheet for this movie
        fetchMovieLink(title);
    } else if (type === 'SERIES') {
        document.getElementById('seasonsContainer').style.display = 'block';
        document.getElementById('movieContainer').style.display = 'none';
        document.getElementById('episodesContainer').style.display = 'none';
        loadSeasons(title);
    }
}

// Fetch movie link from DATABASE sheet
async function fetchMovieLink(title) {
    const database = await fetchSheetData('DATABASE');
    
    database.forEach(row => {
        // DATABASE sheet: A=CATEGORIES, B=ID, C=TITLE, D=TYPE, E=SEASON, F=EPISODE, G=LINK
        const dbTitle = row.values[2];
        const dbType = row.values[3];
        const link = row.values[6];
        
        if (dbTitle === title && dbType === 'MOVIE') {
            console.log('Found movie link:', link);
            window.videoLink = link;
        }
    });
}

// Load seasons for series from DATABASE sheet
async function loadSeasons(title) {
    const database = await fetchSheetData('DATABASE');
    const seasons = new Set();

    database.forEach(row => {
        // DATABASE sheet: A=CATEGORIES, B=ID, C=TITLE, D=TYPE, E=SEASON, F=EPISODE, G=LINK
        const dbTitle = row.values[2];
        const dbType = row.values[3];
        const season = row.values[4];
        
        if (dbTitle === title && dbType === 'SERIES' && season !== 0 && season !== '' && season !== undefined) {
            seasons.add(parseInt(season));
        }
    });

    const seasonsList = document.getElementById('seasonsList');
    seasonsList.innerHTML = '';
    
    const sortedSeasons = Array.from(seasons).sort((a, b) => a - b);
    
    console.log('Seasons found:', sortedSeasons);
    
    if (sortedSeasons.length === 0) {
        seasonsList.innerHTML = '<p style="color: red;">No seasons found</p>';
        return;
    }

    sortedSeasons.forEach(season => {
        const btn = document.createElement('button');
        btn.className = 'season-btn';
        btn.textContent = `Season ${season}`;
        btn.onclick = () => loadEpisodes(title, season);
        seasonsList.appendChild(btn);
    });
}

// Load episodes for selected season from DATABASE sheet
async function loadEpisodes(title, season) {
    const database = await fetchSheetData('DATABASE');
    const episodes = [];

    database.forEach(row => {
        // DATABASE sheet: A=CATEGORIES, B=ID, C=TITLE, D=TYPE, E=SEASON, F=EPISODE, G=LINK
        const dbTitle = row.values[2];
        const dbSeason = row.values[4];
        const episode = row.values[5];
        const link = row.values[6];
        
        if (dbTitle === title && parseInt(dbSeason) === season && episode !== '' && episode !== 0 && episode !== undefined) {
            episodes.push({ 
                episode: parseInt(episode), 
                videoLink: link 
            });
        }
    });

    // Sort episodes by episode number
    episodes.sort((a, b) => a.episode - b.episode);

    const episodesList = document.getElementById('episodesList');
    episodesList.innerHTML = '';
    
    console.log('Episodes found:', episodes);
    
    if (episodes.length === 0) {
        episodesList.innerHTML = '<p style="color: red;">No episodes found</p>';
        return;
    }

    document.getElementById('episodesContainer').style.display = 'block';

    episodes.forEach(ep => {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = `Episode ${ep.episode}`;
        btn.onclick = () => playVideo(ep.videoLink);
        episodesList.appendChild(btn);
    });
}

// Play video
function playVideo(videoLink) {
    const modal = document.getElementById('playerModal');
    const iframe = document.getElementById('videoPlayer');
    
    try {
        console.log('Playing video link:', videoLink);
        
        // Convert Google Drive link to embeddable format
        const fileId = videoLink.split('/d/')[1].split('/')[0];
        console.log('Extracted file ID:', fileId);
        
        iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error playing video:', error);
        alert('Invalid video link! Make sure the Google Drive link is accessible.');
    }
}

// Play movie
function playMovie() {
    playVideo(window.videoLink);
}

// Close player
function closePlayer() {
    document.getElementById('playerModal').style.display = 'none';
    document.getElementById('videoPlayer').src = '';
}

// Go back
function goBack() {
    window.history.back();
}

// Close gallery
function closeGallery() {
    window.history.back();
}

// Go back to category from details
function goBackToCategory(event) {
    event.preventDefault();
    const category = sessionStorage.getItem('selectedCategory');
    if (category) {
        window.location.href = 'category.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Load page content on load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('categoriesGrid')) {
        loadCategories();
    }
    if (document.getElementById('listGrid') && document.title.includes('SJ\'s Collection Hub')) {
        loadListsOnHomepage();
    }
    if (document.getElementById('contentGrid')) {
        loadCategoryContent();
    }
    if (document.getElementById('listGrid') && document.title.includes('Lists')) {
        loadListView();
    }
    if (document.getElementById('detailsPoster')) {
        loadDetails();
    }
});