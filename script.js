// Restaurant Details
const RESTAURANT = {
    name: 'YumRush Food',
    location: 'Malad East, Mumbai',
    phone: '+91-9136535275',
    instagram: '@yumrushfood',
    coordinates: { lat: 19.1864, lng: 72.8493 },
    baseDeliveryCharge: 20,
    pricePerKm: 8,
    maxDeliveryKm: 5,
    minDeliveryKm: 0
};

// Menu Items with images
const items = [
    {
        id: 1,
        name: 'Veg Momos',
        price: 80,
        image: 'https://via.placeholder.com/200x150?text=Veg+Momos',
        description: 'Fresh vegetable momos with soup',
        q: 0
    },
    {
        id: 2,
        name: 'Paneer Momos',
        price: 120,
        image: 'https://via.placeholder.com/200x150?text=Paneer+Momos',
        description: 'Paneer & vegetable momos with soup',
        q: 0
    },
    {
        id: 3,
        name: 'Chicken Momos',
        price: 140,
        image: 'https://via.placeholder.com/200x150?text=Chicken+Momos',
        description: 'Spicy chicken momos with soup',
        q: 0
    },
    {
        id: 4,
        name: 'Paneer Tikka Momos',
        price: 140,
        image: 'https://via.placeholder.com/200x150?text=Paneer+Tikka+Momos',
        description: 'Tandoori paneer momos with chutney',
        q: 0
    },
    {
        id: 5,
        name: 'Tandoori Chicken Momos',
        price: 160,
        image: 'https://via.placeholder.com/200x150?text=Tandoori+Chicken+Momos',
        description: 'Tandoori flavoured chicken momos',
        q: 0
    },
    {
        id: 6,
        name: 'Mixed Momos',
        price: 100,
        image: 'https://via.placeholder.com/200x150?text=Mixed+Momos',
        description: 'Veg and paneer combination momos',
        q: 0
    }
];

let selectedDistance = 0;
let selectedLocationName = '';
let selectedLat = 0;
let selectedLng = 0;
let paymentSlipData = {};
let map = null;
let userMarker = null;
let restaurantCircle = null;

// Initialize Leaflet Map
function initializeMap() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;

    if (typeof L === 'undefined') {
        mapContainer.innerHTML = '<div class="map-error">Map could not load. Please check your internet connection and refresh the page.</div>';
        return;
    }

    if (map) {
        map.invalidateSize();
        return;
    }

    const restaurantLocation = [RESTAURANT.coordinates.lat, RESTAURANT.coordinates.lng];

    map = L.map(mapContainer).setView(restaurantLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker(restaurantLocation, {
        title: '🍜 YumRush Food Restaurant',
        icon: L.icon({
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        })
    }).addTo(map);

    restaurantCircle = L.circle(restaurantLocation, {
        radius: RESTAURANT.maxDeliveryKm * 1000,
        color: '#ff7a00',
        fillColor: '#ff7a00',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.7
    }).addTo(map);

    map.on('click', function(event) {
        if (event && event.latlng) {
            onMapClick(event.latlng);
        }
    });
}

// Handle map click
function onMapClick(latLng) {
    const lat = latLng.lat;
    const lng = latLng.lng;

    const distance = calculateDistanceFromCoords(
        RESTAURANT.coordinates.lat,
        RESTAURANT.coordinates.lng,
        lat,
        lng
    );

    selectedDistance = distance;
    selectedLat = lat;
    selectedLng = lng;

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker([lat, lng], {
        title: 'Your Location',
        icon: L.icon({
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        })
    }).addTo(map);

    selectedLocationName = lat.toFixed(4) + ', ' + lng.toFixed(4);
    updateLocationDisplay(distance);
}

// Calculate distance using Haversine formula
function calculateDistanceFromCoords(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal
}

// Update location display
function updateLocationDisplay(distance) {
    const locationInfo = document.getElementById('locationInfo');
    const selectedLocationNameEl = document.getElementById('selectedLocationName');
    const selectedDistanceEl = document.getElementById('selectedDistance');
    const locationWarning = document.getElementById('locationWarning');
    const selectedLatInput = document.getElementById('selectedLat');
    const selectedLngInput = document.getElementById('selectedLng');
    
    selectedLocationNameEl.textContent = selectedLocationName;
    selectedDistanceEl.textContent = distance.toFixed(1);
    selectedLatInput.value = selectedLat;
    selectedLngInput.value = selectedLng;
    
    locationInfo.style.display = 'block';
    
    if (distance > RESTAURANT.maxDeliveryKm) {
        locationWarning.style.display = 'block';
        locationWarning.innerHTML = '❌ Location is outside delivery area (max ' + RESTAURANT.maxDeliveryKm + ' KM)';
    } else {
        locationWarning.style.display = 'none';
    }
    
    updateCartSummary();
    updatePaymentDisplay();
    updateDeliveryMapInfo(distance);
    calculateTimings();
}

// Show delivery route details and Google Maps directions link
function updateDeliveryMapInfo(distance) {
    const mapInfo = document.getElementById('mapInfo');
    const deliveryTo = document.getElementById('deliveryTo');
    const mapDistance = document.getElementById('mapDistance');
    const mapsLink = document.getElementById('mapsLink');

    if (!mapInfo || !deliveryTo || !mapDistance || !mapsLink) return;

    deliveryTo.textContent = selectedLocationName;
    mapDistance.textContent = distance.toFixed(1);
    mapsLink.href = 'https://www.google.com/maps/dir/?api=1'
        + '&origin=' + encodeURIComponent(`${RESTAURANT.coordinates.lat},${RESTAURANT.coordinates.lng}`)
        + '&destination=' + encodeURIComponent(`${selectedLat},${selectedLng}`)
        + '&travelmode=driving';
    mapInfo.style.display = 'block';
}

// Draw Menu
function draw() {
    const menu = document.getElementById('menu');
    menu.innerHTML = '';
    items.forEach((item, index) => {
        menu.innerHTML += `
            <div class='card'>
                <img src='${item.image}' alt='${item.name}' class='item-image'>
                <h3>${item.name}</h3>
                <p class='description'>${item.description}</p>
                <p class='price'>₹${item.price}</p>
                <div class='quantity-controls'>
                    <button onclick='changeQuantity(${index},-1)' class='btn-qty'>−</button>
                    <span class='qty-display'>${item.q}</span>
                    <button onclick='changeQuantity(${index},1)' class='btn-qty'>+</button>
                </div>
            </div>
        `;
    });
}

// Change Quantity
function changeQuantity(index, change) {
    items[index].q = Math.max(0, items[index].q + change);
    draw();
    updateCartSummary();
}

// Calculate Total
function calculateTotal() {
    return items.reduce((sum, item) => sum + (item.q * item.price), 0);
}

// Apply Discount Tiers
function calculateDiscount(total) {
    if (total >= 2500) return (total * 0.12);
    if (total >= 1000) return (total * 0.08);
    if (total >= 500) return (total * 0.05);
    return 0;
}

// Get Discount Percentage
function getDiscountPercent(total) {
    if (total >= 2500) return 12;
    if (total >= 1000) return 8;
    if (total >= 500) return 5;
    return 0;
}

// Calculate Delivery Charge
function calculateDeliveryCharge(distance) {
    if (distance > RESTAURANT.maxDeliveryKm) return 0;
    const charge = RESTAURANT.baseDeliveryCharge + (distance * RESTAURANT.pricePerKm);
    return Math.round(charge);
}

// Update Cart Summary
function updateCartSummary() {
    const total = calculateTotal();
    const hasItems = total > 0;
    
    const cartSummary = document.getElementById('cartSummary');
    if (cartSummary) {
        cartSummary.style.display = hasItems ? 'block' : 'none';
    }
    
    if (!hasItems) return;
    
    let cartHTML = '';
    items.forEach(item => {
        if (item.q > 0) {
            cartHTML += `<p>${item.name} x${item.q} = ₹${item.q * item.price}</p>`;
        }
    });
    
    const cartItemsEl = document.getElementById('cartItems');
    if (cartItemsEl) cartItemsEl.innerHTML = cartHTML;
    
    const discount = calculateDiscount(total);
    const deliveryCharge = selectedDistance > 0 && selectedDistance <= RESTAURANT.maxDeliveryKm ? calculateDeliveryCharge(selectedDistance) : 0;
    const grandTotal = total - discount + deliveryCharge;
    
    const foodTotalEl = document.getElementById('foodTotal');
    const discountAmountEl = document.getElementById('discountAmount');
    const deliveryChargeEl = document.getElementById('deliveryCharge');
    const grandTotalEl = document.getElementById('grandTotal');
    
    if (foodTotalEl) foodTotalEl.textContent = '₹' + total;
    if (discountAmountEl) discountAmountEl.textContent = discount > 0 ? '-₹' + Math.round(discount) : '₹0';
    if (deliveryChargeEl) deliveryChargeEl.textContent = '₹' + deliveryCharge + ' (for ' + selectedDistance.toFixed(1) + ' KM)';
    if (grandTotalEl) grandTotalEl.textContent = '₹' + Math.round(grandTotal);
    
    updateQRCode(Math.round(grandTotal));
}

// Update Payment Display
function updatePaymentDisplay() {
    const total = calculateTotal();
    if (total === 0) return;
    
    const discount = calculateDiscount(total);
    const deliveryCharge = selectedDistance > 0 && selectedDistance <= RESTAURANT.maxDeliveryKm ? calculateDeliveryCharge(selectedDistance) : 0;
    const grandTotal = total - discount + deliveryCharge;
    const paymentType = document.querySelector('input[name="paymentType"]:checked');
    
    if (!paymentType) return;
    
    let paymentInfo = '';
    if (paymentType.value === '70-30') {
        const beforePayment = Math.round(grandTotal * 0.7);
        const afterPayment = Math.round(grandTotal * 0.3);
        paymentInfo = `
            <strong>Before Order:</strong> ₹${beforePayment} (70%)<br>
            <strong>After Delivery:</strong> ₹${afterPayment} (30%)<br>
            <strong>Total:</strong> ₹${grandTotal}
        `;
    } else {
        paymentInfo = `
            <strong>Full Amount:</strong> ₹${grandTotal}<br>
            (Pay before order)
        `;
    }
    
    const paymentInfoEl = document.getElementById('paymentInfo');
    if (paymentInfoEl) paymentInfoEl.innerHTML = paymentInfo;
}

// Update QR Code
function updateQRCode(amount) {
    const qrSection = document.getElementById('qrSection');
    const qrcode = document.getElementById('qrcode');
    const qrAmount = document.getElementById('qrAmount');
    
    if (!qrSection || !qrcode) return;
    
    if (amount > 0) {
        qrSection.style.display = 'block';
        qrcode.innerHTML = '';
        if (qrAmount) qrAmount.textContent = '₹' + amount;
        
        // Generate UPI QR Code
        const upiString = `upi://pay?pa=yumrush@upi&pn=YumRush&am=${amount}&tn=YumRush Food Order`;
        new QRCode(qrcode, {
            text: upiString,
            width: 150,
            height: 150
        });
    }
}

// Download generated payment QR code
function downloadQRCode() {
    const qrcode = document.getElementById('qrcode');
    if (!qrcode) return;

    const qrImage = qrcode.querySelector('canvas') || qrcode.querySelector('img');
    if (!qrImage) {
        alert('Please add items first to generate the QR code.');
        return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.download = 'yumrush-payment-qr.png';
    downloadLink.href = qrImage.tagName.toLowerCase() === 'canvas'
        ? qrImage.toDataURL('image/png')
        : qrImage.src;
    downloadLink.click();
}

// Calculate Timings based on distance
function calculateTimings() {
    const timingDisplay = document.getElementById('timingDisplay');
    if (!timingDisplay) return;
    
    if (selectedDistance === 0 || selectedDistance > RESTAURANT.maxDeliveryKm) {
        timingDisplay.style.display = 'none';
        return;
    }
    
    timingDisplay.style.display = 'block';
    
    const now = new Date();
    const orderTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    // Preparation time: 20-25 mins (avg 22 mins)
    const prepMinutes = 22;
    const readyTime = new Date(now.getTime() + prepMinutes * 60000);
    const readyTimeStr = readyTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    // Delivery time: preparation time + distance-based delivery (~3 mins per KM)
    const deliveryMinFromDist = Math.ceil(selectedDistance * 3);
    const totalMinutes = prepMinutes + deliveryMinFromDist;
    const deliveryTime = new Date(now.getTime() + totalMinutes * 60000);
    const deliveryTimeStr = deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const orderTimeEl = document.getElementById('orderTime');
    const dispatchTimeEl = document.getElementById('dispatchTime');
    const deliveryTimeEl = document.getElementById('deliveryTime');
    
    if (orderTimeEl) orderTimeEl.textContent = orderTime;
    if (dispatchTimeEl) dispatchTimeEl.textContent = readyTimeStr + ' (~' + prepMinutes + ' mins - Preparation)';
    if (deliveryTimeEl) deliveryTimeEl.textContent = deliveryTimeStr + ' (~' + totalMinutes + ' mins - Total)';
}

// Generate Payment Slip HTML with exact location
function getPaymentSlipHTML(orderData = null) {
    const total = calculateTotal();
    const discount = calculateDiscount(total);
    const deliveryCharge = selectedDistance > 0 && selectedDistance <= RESTAURANT.maxDeliveryKm ? calculateDeliveryCharge(selectedDistance) : 0;
    const grandTotal = total - discount + deliveryCharge;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    const now = new Date();
    const orderId = orderData?.orderId || 'YR' + Math.random().toString(9).substr(2, 9);
    const timestamp = orderData?.timestamp || now.toLocaleString('en-IN');
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const flatNo = document.getElementById('flatNo').value;
    const roadName = document.getElementById('roadName').value;
    const areaName = document.getElementById('areaName').value;
    const fullAddress = `${flatNo}, ${roadName}, ${areaName}`;
    
    let slip = `
<div style="border: 2px solid #ff7a00; border-radius: 10px; padding: 20px; background: #f9f9f9; max-width: 500px; margin: 20px auto; font-family: Arial;">
    <div style="text-align: center; border-bottom: 2px solid #ff7a00; padding-bottom: 15px;">
        <h2 style="color: #ff7a00; margin: 0;">🍜 YumRush Food</h2>
        <p style="margin: 5px 0; font-size: 12px;">${RESTAURANT.location}</p>
        <p style="margin: 5px 0; font-size: 12px;">📞 ${RESTAURANT.phone}</p>
    </div>
    
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 5px;">
        <h3 style="color: #ff7a00; margin-top: 0;">💳 Payment Receipt</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${timestamp}</p>
    </div>
    
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 5px;">
        <h4 style="color: #333; margin-top: 0;">📦 Customer Details</h4>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
        <p style="margin: 5px 0;"><strong>Address:</strong> ${fullAddress}</p>
        <p style="margin: 5px 0;"><strong>📍 Exact Location:</strong><br/><span style="font-size:11px; color:#666;">${selectedLocationName}</span></p>
        <p style="margin: 5px 0;"><strong>📏 Distance:</strong> ${selectedDistance.toFixed(1)} KM</p>
    </div>
    
    <div style="margin: 15px 0; padding: 10px; background: #e3f2fd; border-radius: 5px;">
        <h4 style="color: #2196f3; margin-top: 0;">⏱️ Delivery Timings</h4>
        <p style="margin: 5px 0;"><strong>Ready for Pickup:</strong> ${orderData?.readyTimeStr || '--'} (~${orderData?.prepMinutes || 22} mins - Preparation)</p>
        <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${orderData?.deliveryTimeStr || '--'} (~${orderData?.totalMinutes || 0} mins Total)</p>
    </div>
    
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 5px;">
        <h4 style="color: #333; margin-top: 0;">🍽️ Order Items</h4>`;
    
    items.forEach(item => {
        if (item.q > 0) {
            slip += `<p style="margin: 5px 0;"><strong>${item.name}</strong> x${item.q} = ₹${item.q * item.price}</p>`;
        }
    });
    
    slip += `</div>
    
    <div style="margin: 15px 0; padding: 15px; background: #ffe6cc; border-radius: 5px; border-left: 4px solid #ff7a00;">
        <p style="margin: 8px 0;"><strong>Food Total:</strong> ₹${total}</p>
        ${discount > 0 ? `<p style="margin: 8px 0; color: green;"><strong>🎉 Discount (${getDiscountPercent(total)}%):</strong> -₹${Math.round(discount)}</p>` : ''}
        <p style="margin: 8px 0;"><strong>Delivery Charge (${selectedDistance.toFixed(1)}KM):</strong> ₹${deliveryCharge}</p>
        <p style="margin: 8px 0; font-size: 16px; color: #ff7a00;"><strong>Grand Total: ₹${Math.round(grandTotal)}</strong></p>
    </div>
    
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 5px;">
        <h4 style="color: #333; margin-top: 0;">💰 Payment Method</h4>
        ${paymentType === '70-30' ? 
            `<p style="margin: 5px 0;"><strong>70% Before Order:</strong> ₹${Math.round(grandTotal * 0.7)}</p>
             <p style="margin: 5px 0;"><strong>30% After Delivery:</strong> ₹${Math.round(grandTotal * 0.3)}</p>
             <p style="margin: 5px 0; font-size: 12px; color: red;">⚠️ Show this slip to delivery boy for final payment</p>` : 
            `<p style="margin: 5px 0;"><strong>Full Payment Before Order:</strong> ₹${Math.round(grandTotal)}</p>
             <p style="margin: 5px 0; font-size: 12px; color: green;">✓ Complete payment received</p>`
        }
    </div>
    
    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 5px; text-align: center;">
        <h4 style="color: #ff7a00; margin-top: 0;">📱 Follow Us</h4>
        <p style="margin: 5px 0;"><strong>Instagram:</strong> ${RESTAURANT.instagram}</p>
        <p style="margin: 5px 0; font-size: 12px;">Thank you for ordering! 🙏</p>
    </div>
</div>`;
    
    return slip;
}

// Generate Payment Slip (Preview)
function generatePaymentSlip() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const flatNo = document.getElementById('flatNo').value;
    const roadName = document.getElementById('roadName').value;
    const areaName = document.getElementById('areaName').value;
    
    // Validation
    if (!name || !phone || !flatNo || !roadName || !areaName || selectedDistance === 0) {
        alert('❌ Please fill all details and select location on map');
        return;
    }
    
    if (phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
        alert('❌ Please enter a valid 10-digit phone number');
        return;
    }
    
    if (selectedDistance > RESTAURANT.maxDeliveryKm) {
        alert('❌ Selected location is outside delivery area (max ' + RESTAURANT.maxDeliveryKm + ' KM)');
        return;
    }
    
    const total = calculateTotal();
    if (total === 0) {
        alert('❌ Please select items');
        return;
    }
    
    // Minimum order validation
    if (total < 250) {
        alert('❌ Minimum order amount is ₹250. Current total: ₹' + total);
        return;
    }
    
    const fullAddress = `${flatNo}, ${roadName}, ${areaName}`;
    const discount = calculateDiscount(total);
    const deliveryCharge = calculateDeliveryCharge(selectedDistance);
    const grandTotal = total - discount + deliveryCharge;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    const now = new Date();
    const orderId = 'YR' + Math.random().toString(9).substr(2, 9);
    const timestamp = now.toLocaleString('en-IN');
    
    // Preparation and delivery time calculation
    const prepMinutes = 22; // 20-25 mins average
    const deliveryMinFromDist = Math.ceil(selectedDistance * 3);
    const totalMinutes = prepMinutes + deliveryMinFromDist;
    
    const readyTime = new Date(now.getTime() + prepMinutes * 60000);
    const readyTimeStr = readyTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const deliveryTime = new Date(now.getTime() + totalMinutes * 60000);
    const deliveryTimeStr = deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    paymentSlipData = {
        orderId,
        timestamp,
        name,
        phone,
        address: fullAddress,
        items: items.filter(i => i.q > 0),
        total,
        discount,
        discountPercent: getDiscountPercent(total),
        deliveryCharge,
        grandTotal: Math.round(grandTotal),
        paymentType,
        distance: selectedDistance,
        location: selectedLocationName,
        readyTimeStr,
        deliveryTimeStr,
        prepMinutes,
        totalMinutes
    };
    
    const paymentSlipEl = document.getElementById('paymentSlip');
    if (paymentSlipEl) paymentSlipEl.innerHTML = getPaymentSlipHTML(paymentSlipData);
    
    const slipModal = document.getElementById('slipModal');
    if (slipModal) slipModal.style.display = 'block';
}

// Close Slip Modal
function closeSlip() {
    const slipModal = document.getElementById('slipModal');
    if (slipModal) slipModal.style.display = 'none';
}

// Print Slip
function printSlip() {
    const printWindow = window.open('', '', 'height=800,width=600');
    printWindow.document.write(document.getElementById('paymentSlip').innerHTML);
    printWindow.document.close();
    printWindow.print();
}

// Share Slip on WhatsApp
function shareSlipWhatsApp() {
    const slip = paymentSlipData;
    let msg = `🍜 *YumRush Food - Payment Receipt*%0A%0A`;
    msg += `*Order ID:* ${slip.orderId}%0A`;
    msg += `*Time:* ${slip.timestamp}%0A%0A`;
    msg += `👤 *Customer Details*%0AName: ${slip.name}%0APhone: ${slip.phone}%0A%0A`;
    msg += `📍 *Delivery Location:*%0A${slip.location}%0A%0A`;
    msg += `📦 *Items:*%0A`;
    slip.items.forEach(item => {
        msg += `${item.name} x${item.q} = ₹${item.q * item.price}%0A`;
    });
    msg += `%0A💰 *Payment Details*%0A`;
    msg += `Food Total: ₹${slip.total}%0A`;
    if (slip.discount > 0) {
        msg += `Discount (${slip.discountPercent}%): -₹${Math.round(slip.discount)}%0A`;
    }
    msg += `Delivery Charge: ₹${slip.deliveryCharge}%0A`;
    msg += `*Grand Total: ₹${slip.grandTotal}*%0A%0A`;
    
    if (slip.paymentType === '70-30') {
        msg += `*Payment Method:*%0A70%% Before: ₹${Math.round(slip.grandTotal * 0.7)}%0A30%% After: ₹${Math.round(slip.grandTotal * 0.3)}%0A%0A⚠️ Show this to delivery boy for final payment`;
    } else {
        msg += `*Payment Method:*%0AFull Payment Before Order: ₹${slip.grandTotal}`;
    }
    
    window.open('https://wa.me/?text=' + msg, '_blank');
}

// Main Order Function
function order() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const flatNo = document.getElementById('flatNo').value;
    const roadName = document.getElementById('roadName').value;
    const areaName = document.getElementById('areaName').value;
    
    // Validation: Phone number must be 10 digits
    if (!name || !phone || !flatNo || !roadName || !areaName || selectedDistance === 0) {
        alert('❌ Please fill all details and select location on map');
        return;
    }
    
    if (phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
        alert('❌ Please enter a valid 10-digit phone number');
        return;
    }
    
    if (selectedDistance > RESTAURANT.maxDeliveryKm) {
        alert('❌ Selected location is outside delivery area (max ' + RESTAURANT.maxDeliveryKm + ' KM)');
        return;
    }
    
    const total = calculateTotal();
    if (total === 0) {
        alert('❌ Please select items');
        return;
    }
    
    // Minimum order validation: ₹250
    if (total < 250) {
        alert('❌ Minimum order amount is ₹250. Current total: ₹' + total);
        return;
    }
    
    const discount = calculateDiscount(total);
    const deliveryCharge = calculateDeliveryCharge(selectedDistance);
    const grandTotal = total - discount + deliveryCharge;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    const now = new Date();
    const orderId = 'YR' + Math.random().toString(9).substr(2, 9);
    const orderTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    // Preparation time: 20-25 mins + delivery time based on distance
    const prepMinutes = 22; // Average of 20-25 mins
    const deliveryMinFromDist = Math.ceil(selectedDistance * 3); // ~3 mins per KM
    const totalMinutes = prepMinutes + deliveryMinFromDist;
    
    const readyTime = new Date(now.getTime() + prepMinutes * 60000);
    const readyTimeStr = readyTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const deliveryTime = new Date(now.getTime() + totalMinutes * 60000);
    const deliveryTimeStr = deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const fullAddress = `${flatNo}, ${roadName}, ${areaName}`;
    
    let msg = `🍜 *YumRush Food - Order Confirmation*%0A%0A`;
    msg += `*Order ID:* ${orderId}%0A`;
    msg += `*Order Time:* ${orderTime}%0A%0A`;
    msg += `👤 *Customer Details*%0A`;
    msg += `Name: ${name}%0A`;
    msg += `Phone: ${phone}%0A`;
    msg += `Address: ${fullAddress}%0A`;
    msg += `📍 Exact Location: ${selectedLocationName}%0A%0A`;
    
    msg += `📦 *Your Order*%0A`;
    items.forEach(item => {
        if (item.q > 0) {
            msg += `${item.name} x${item.q} = ₹${item.q * item.price}%0A`;
        }
    });
    
    msg += `%0A💰 *Bill Details*%0A`;
    msg += `Food Total: ₹${total}%0A`;
    if (discount > 0) {
        msg += `🎉 Discount (${getDiscountPercent(total)}%): -₹${Math.round(discount)}%0A`;
    }
    msg += `🚚 Delivery Charge (${selectedDistance.toFixed(1)} KM): ₹${deliveryCharge}%0A`;
    msg += `*Grand Total: ₹${Math.round(grandTotal)}*%0A%0A`;
    
    msg += `⏱️ *Order Timings*%0A`;
    msg += `Order Placed: ${orderTime}%0A`;
    msg += `Ready for Delivery: ${readyTimeStr} (~${prepMinutes} mins)%0A`;
    msg += `🚚 Estimated Delivery: ${deliveryTimeStr} (~${totalMinutes} mins)%0A%0A`;
    
    msg += `💳 *Payment Method*%0A`;
    if (paymentType === '70-30') {
        msg += `70%% Before Order: ₹${Math.round(grandTotal * 0.7)}%0A`;
        msg += `30%% After Delivery: ₹${Math.round(grandTotal * 0.3)}%0A`;
        msg += `⚠️ Show payment slip to delivery boy for final payment%0A%0A`;
    } else {
        msg += `Full Payment Before Order: ₹${Math.round(grandTotal)}%0A%0A`;
    }
    
    msg += `📱 Follow us: ${RESTAURANT.instagram}%0A`;
    msg += `☎️ Contact: ${RESTAURANT.phone}%0A%0A`;
    msg += `Thank you for ordering! 🙏`;
    
    window.open('https://wa.me/919136535275?text=' + msg, '_blank');
}

// Reset Order
function resetOrder() {
    items.forEach(item => item.q = 0);
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('flatNo').value = '';
    document.getElementById('roadName').value = '';
    document.getElementById('areaName').value = '';
    selectedDistance = 0;
    selectedLocationName = '';
    selectedLat = 0;
    selectedLng = 0;
    if (userMarker && map) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    draw();
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo) locationInfo.style.display = 'none';
    const cartSummary = document.getElementById('cartSummary');
    if (cartSummary) cartSummary.style.display = 'none';
    const timingDisplay = document.getElementById('timingDisplay');
    if (timingDisplay) timingDisplay.style.display = 'none';
    const mapInfo = document.getElementById('mapInfo');
    if (mapInfo) mapInfo.style.display = 'none';
    const qrSection = document.getElementById('qrSection');
    if (qrSection) qrSection.style.display = 'none';
}

// Initialize
function init() {
    draw();
    // Initialize map after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMap);
    } else {
        setTimeout(initializeMap, 100);
    }
}

// Call init
init();
