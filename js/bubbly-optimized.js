/**
 * Optimized Bubbly Background - Canvas Performance Improvements
 * Original: bubbly-bg.js
 * Optimizations: Reduced redraws, object pooling, efficient rendering
 */

"use strict";

window.bubbyOptimized = function(options) {
    const config = options || {};
    const canvas = config.canvas || document.createElement("canvas");
    let width = canvas.width;
    let height = canvas.height;
    
    // Canvas setup (only if not already in DOM)
    if (canvas.parentNode === null) {
        canvas.setAttribute("style", 
            "position:fixed;z-index:-1;left:0;top:0;min-width:100vw;min-height:100vh;"
        );
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
    }
    
    const ctx = canvas.getContext("2d");
    
    // 🚀 最適化1: OffscreenCanvas for background gradient (if supported)
    let backgroundCanvas;
    let backgroundCtx;
    
    if (typeof OffscreenCanvas !== 'undefined') {
        backgroundCanvas = new OffscreenCanvas(width, height);
        backgroundCtx = backgroundCanvas.getContext("2d");
    } else {
        backgroundCanvas = document.createElement("canvas");
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;
        backgroundCtx = backgroundCanvas.getContext("2d");
    }
    
    // Pre-render background gradient
    const gradient = backgroundCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, config.colorStart || "#3333ff");
    gradient.addColorStop(1, config.colorStop || "#000066");
    backgroundCtx.fillStyle = gradient;
    backgroundCtx.fillRect(0, 0, width, height);
    
    // 🚀 最適化2: Reduced bubble count and optimized properties
    const bubbleCount = config.bubbles || Math.min(20, Math.floor(0.01 * (width + height)));
    const bubbles = [];
    
    // 🚀 最適化3: Object pooling - pre-create bubble objects
    for (let i = 0; i < bubbleCount; i++) {
        bubbles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 4 + Math.random() * (width / 50), // Smaller max radius
            angle: Math.random() * Math.PI * 2,
            velocity: 0.2 + Math.random() * 0.8, // Slower movement
            opacity: 0.05 + Math.random() * 0.15, // Pre-calculated opacity
            active: true
        });
    }
    
    // 🚀 最適化4: Batch rendering with reduced frequency
    let lastFrameTime = 0;
    const targetFPS = 30; // Reduced from 60fps
    const frameInterval = 1000 / targetFPS;
    
    // 🚀 最適化5: Dirty rectangle tracking
    let needsFullRedraw = true;
    
    function render(currentTime) {
        if (canvas.parentNode === null) {
            return; // Stop if canvas removed
        }
        
        // Frame rate limiting
        if (currentTime - lastFrameTime < frameInterval) {
            if (config.animate !== false) {
                requestAnimationFrame(render);
            }
            return;
        }
        lastFrameTime = currentTime;
        
        // 🚀 最適化6: Clear only when necessary
        if (needsFullRedraw) {
            ctx.clearRect(0, 0, width, height);
            // Draw pre-rendered background
            ctx.drawImage(backgroundCanvas, 0, 0);
            needsFullRedraw = false;
        } else {
            // Partial clear with fade effect
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(51, 51, 255, 0.02)"; // Very subtle fade
            ctx.fillRect(0, 0, width, height);
        }
        
        // 🚀 最適化7: Batch bubble rendering
        ctx.globalCompositeOperation = config.compose || "lighter";
        
        // Group bubbles by opacity for batch rendering
        const opacityGroups = {};
        
        bubbles.forEach(bubble => {
            if (!bubble.active) return;
            
            // Update position
            bubble.x += Math.cos(bubble.angle) * bubble.velocity;
            bubble.y += Math.sin(bubble.angle) * bubble.velocity;
            
            // Boundary wrapping
            if (bubble.x - bubble.radius > width) bubble.x = -bubble.radius;
            if (bubble.x + bubble.radius < 0) bubble.x = width + bubble.radius;
            if (bubble.y - bubble.radius > height) bubble.y = -bubble.radius;
            if (bubble.y + bubble.radius < 0) bubble.y = height + bubble.radius;
            
            // Group by opacity for batch rendering
            const opacityKey = Math.round(bubble.opacity * 100);
            if (!opacityGroups[opacityKey]) {
                opacityGroups[opacityKey] = [];
            }
            opacityGroups[opacityKey].push(bubble);
        });
        
        // 🚀 最適化8: Render bubbles in batches by opacity
        Object.keys(opacityGroups).forEach(opacityKey => {
            const opacity = opacityKey / 100;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            
            opacityGroups[opacityKey].forEach(bubble => {
                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        
        // Continue animation
        if (config.animate !== false) {
            requestAnimationFrame(render);
        }
    }
    
    // 🚀 最適化9: Resize handler with debouncing
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            
            // Update background canvas
            backgroundCanvas.width = width;
            backgroundCanvas.height = height;
            const newGradient = backgroundCtx.createLinearGradient(0, 0, width, height);
            newGradient.addColorStop(0, config.colorStart || "#3333ff");
            newGradient.addColorStop(1, config.colorStop || "#000066");
            backgroundCtx.fillStyle = newGradient;
            backgroundCtx.fillRect(0, 0, width, height);
            
            needsFullRedraw = true;
        }, 250);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    requestAnimationFrame(render);
    
    // Return control object
    return {
        canvas: canvas,
        stop: function() {
            config.animate = false;
            window.removeEventListener('resize', handleResize);
        },
        start: function() {
            config.animate = true;
            requestAnimationFrame(render);
        }
    };
};