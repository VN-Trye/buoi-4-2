// API Base URL - Updated to use your API
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

// State management
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortColumn = null;
let sortDirection = 'asc';
let currentProduct = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadProducts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Items per page
    document.getElementById('itemsPerPage').addEventListener('change', handleItemsPerPageChange);

    // Sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.addEventListener('click', handleSort);
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    // Edit button in detail modal
    document.getElementById('editBtn').addEventListener('click', openEditModal);

    // Save edit button
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);

    // Save create button
    document.getElementById('saveCreateBtn').addEventListener('click', createProduct);

    // Tooltip handling
    setupTooltip();
}

// Load products from data.json file
async function loadProducts() {
    showLoading();

    try {
        const response = await fetch('data.json');
        if (response.ok) {
            allProducts = await response.json();
            filteredProducts = [...allProducts];
            renderTable();
        } else {
            throw new Error('Không thể tải file data.json');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Không thể tải dữ liệu từ file data.json. Vui lòng kiểm tra file có tồn tại không.');
    } finally {
        hideLoading();
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(product =>
        product.title.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    renderTable();
}

// Handle items per page change
function handleItemsPerPageChange(e) {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
}

// Handle sorting
function handleSort(e) {
    const column = e.target.dataset.sort;

    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredProducts.sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];

        if (column === 'price') {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else if (column === 'title') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Update sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.className = 'fas fa-sort sort-icon';
    });
    e.target.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;

    renderTable();
}

// Render table
function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    pageProducts.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.productId = product.id;
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${truncateText(product.title, 50)}</td>
            <td class="price-tag">$${product.price}</td>
            <td><span class="category-badge">${product.category?.name || 'N/A'}</span></td>
            <td>
                ${product.images && product.images.length > 0
                ? `<img src="${product.images[0]}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/60'">`
                : '<img src="https://via.placeholder.com/60" alt="No image" class="product-image">'}
            </td>
            <td>
                <button class="btn btn-sm btn-gradient" onclick="viewDetail(${product.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;

        // Add description tooltip on hover
        row.addEventListener('mouseenter', (e) => showTooltip(e, product.description));
        row.addEventListener('mouseleave', hideTooltip);

        tbody.appendChild(row);
    });

    renderPagination();
    updateTotalItems();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>`;
    pagination.appendChild(prevLi);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>`;
    pagination.appendChild(nextLi);
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
    }
}

// Update total items display
function updateTotalItems() {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    document.getElementById('totalItems').textContent =
        `Hiển thị ${start}-${end} trong tổng số ${filteredProducts.length} sản phẩm`;
}

// Tooltip functions
function setupTooltip() {
    const tooltip = document.getElementById('descriptionTooltip');
    document.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'block') {
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
        }
    });
}

function showTooltip(e, description) {
    const tooltip = document.getElementById('descriptionTooltip');
    tooltip.textContent = description || 'Không có mô tả';
    tooltip.style.display = 'block';
    tooltip.style.left = (e.pageX + 15) + 'px';
    tooltip.style.top = (e.pageY + 15) + 'px';
}

function hideTooltip() {
    document.getElementById('descriptionTooltip').style.display = 'none';
}

// View detail
function viewDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    currentProduct = product;

    const modalBody = document.getElementById('detailModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    ${product.images && product.images.length > 0
            ? `<img src="${product.images[0]}" alt="${product.title}" class="img-fluid rounded" onerror="this.src='https://via.placeholder.com/400'">`
            : '<img src="https://via.placeholder.com/400" alt="No image" class="img-fluid rounded">'}
                </div>
                ${product.images && product.images.length > 1 ? `
                    <div class="d-flex gap-2">
                        ${product.images.slice(1, 4).map(img =>
                `<img src="${img}" alt="${product.title}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/80'">`
            ).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="col-md-6">
                <h3>${product.title}</h3>
                <p class="price-tag">$${product.price}</p>
                <p><strong>ID:</strong> ${product.id}</p>
                <p><strong>Category:</strong> <span class="category-badge">${product.category?.name || 'N/A'}</span></p>
                <p><strong>Slug:</strong> ${product.slug || 'N/A'}</p>
                <hr>
                <h5>Mô tả:</h5>
                <p>${product.description || 'Không có mô tả'}</p>
                <hr>
                <p class="text-muted"><small>Tạo lúc: ${new Date(product.creationAt).toLocaleString('vi-VN')}</small></p>
                <p class="text-muted"><small>Cập nhật: ${new Date(product.updatedAt).toLocaleString('vi-VN')}</small></p>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// Open edit modal
function openEditModal() {
    if (!currentProduct) return;

    document.getElementById('editId').value = currentProduct.id;
    document.getElementById('editTitle').value = currentProduct.title;
    document.getElementById('editPrice').value = currentProduct.price;
    document.getElementById('editDescription').value = currentProduct.description || '';
    document.getElementById('editCategoryId').value = currentProduct.category?.id || '';
    document.getElementById('editImages').value = currentProduct.images ? currentProduct.images.join(', ') : '';

    bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// Save edit
async function saveEdit() {
    const id = document.getElementById('editId').value;
    const data = {
        title: document.getElementById('editTitle').value,
        price: parseFloat(document.getElementById('editPrice').value),
        description: document.getElementById('editDescription').value,
        categoryId: parseInt(document.getElementById('editCategoryId').value),
        images: document.getElementById('editImages').value.split(',').map(s => s.trim())
    };

    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const updatedProduct = await response.json();
            // Update local data
            const index = allProducts.findIndex(p => p.id == id);
            if (index !== -1) {
                allProducts[index] = updatedProduct;
                filteredProducts = [...allProducts];
                renderTable();
            }

            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            alert('Cập nhật sản phẩm thành công!');
        } else {
            alert('Lỗi khi cập nhật sản phẩm!');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Lỗi khi cập nhật sản phẩm!');
    }
}

// Create product
async function createProduct() {
    const data = {
        title: document.getElementById('createTitle').value,
        price: parseFloat(document.getElementById('createPrice').value),
        description: document.getElementById('createDescription').value,
        categoryId: parseInt(document.getElementById('createCategoryId').value),
        images: document.getElementById('createImages').value.split(',').map(s => s.trim())
    };

    try {
        const response = await fetch(`${API_BASE_URL}/products/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const newProduct = await response.json();
            // Add to local data
            allProducts.unshift(newProduct);
            filteredProducts = [...allProducts];
            renderTable();

            bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
            document.getElementById('createForm').reset();
            alert('Tạo sản phẩm thành công!');
        } else {
            alert('Lỗi khi tạo sản phẩm!');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Lỗi khi tạo sản phẩm!');
    }
}

// Export to CSV
function exportToCSV() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    let csv = 'ID,Title,Price,Category,Description,Images\n';

    pageProducts.forEach(product => {
        const row = [
            product.id,
            `"${product.title.replace(/"/g, '""')}"`,
            product.price,
            `"${product.category?.name || 'N/A'}"`,
            `"${(product.description || '').replace(/"/g, '""')}"`,
            `"${product.images ? product.images.join('; ') : ''}"`
        ];
        csv += row.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_page_${currentPage}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showLoading() {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';
}

function hideLoading() {
    // Loading will be hidden when table is rendered
}
