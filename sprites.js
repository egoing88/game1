// Procedural Sprites for Caveman Adventure (Prehistorik style)
// Draws high-quality retro-styled vectors using HTML5 Canvas API

// Polyfill for CanvasRenderingContext2D.prototype.roundRect for compatibility with older browsers
if (typeof CanvasRenderingContext2D.prototype.roundRect !== 'function') {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        if (!radii) radii = 0;
        if (typeof radii === 'number') {
            radii = [radii, radii, radii, radii];
        } else if (Array.isArray(radii)) {
            if (radii.length === 1) radii = [radii[0], radii[0], radii[0], radii[0]];
            else if (radii.length === 2) radii = [radii[0], radii[1], radii[0], radii[1]];
            else if (radii.length === 3) radii = [radii[0], radii[1], radii[2], radii[1]];
        } else {
            radii = [0, 0, 0, 0];
        }
        
        let r0 = radii[0];
        let r1 = radii[1];
        let r2 = radii[2];
        let r3 = radii[3];
        
        this.beginPath();
        this.moveTo(x + r0, y);
        this.lineTo(x + w - r1, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r1);
        this.lineTo(x + w, y + h - r2);
        this.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
        this.lineTo(x + r3, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r3);
        this.lineTo(x, y + r0);
        this.quadraticCurveTo(x, y, x + r0, y);
        this.closePath();
        return this;
    };
}

const Sprites = {
    // Helper to flip graphics horizontally based on direction (1 = right, -1 = left)
    setupTransform(ctx, x, y, width, height, direction, rotation = 0) {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.scale(direction, 1);
        if (rotation !== 0) {
            ctx.rotate(rotation);
        }
    },

    restoreTransform(ctx) {
        ctx.restore();
    },

    // Draw the main character: Caveman (고인돌 원시인) - Upgraded to Option 1: Wild Shaman
    drawCaveman(ctx, x, y, width, height, state, direction, tick, isFlashed = false) {
        this.setupTransform(ctx, x, y, width, height, direction);

        // Flash red if damaged
        if (isFlashed) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowBlur = 0;
        }

        // Gradients for body/skin shading (Premium Look)
        let skinGrad = ctx.createLinearGradient(-15, -15, 15, 15);
        skinGrad.addColorStop(0, '#ffbf9e'); // Light skin glow
        skinGrad.addColorStop(0.5, '#ffa47a'); // Base flesh skin
        skinGrad.addColorStop(1, '#d97b52'); // Shadow skin

        // Draw wild hair behind (Option 1: Wild Shaman spiky hair)
        let hairGrad = ctx.createLinearGradient(-15, -28, 22, 10);
        hairGrad.addColorStop(0, '#2d1f18'); // highlights/top
        hairGrad.addColorStop(0.5, '#1e1410'); // body
        hairGrad.addColorStop(1, '#0c0705'); // shadow
        ctx.fillStyle = hairGrad;
        
        ctx.beginPath();
        // Draw complex spiky polygon for hair behind
        ctx.moveTo(-15, -15);
        ctx.lineTo(-8, -25);
        ctx.lineTo(-4, -20);
        ctx.lineTo(4, -28);
        ctx.lineTo(8, -22);
        ctx.lineTo(15, -24);
        ctx.lineTo(18, -12);
        ctx.lineTo(24, 2);
        ctx.lineTo(20, 12);
        ctx.lineTo(12, 6);
        ctx.lineTo(5, 8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();

        // Stroke hair for separation
        ctx.strokeStyle = '#050302';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Caveman body / clothes (Tunic: Orange Tiger-skin tunic with gradient and stripes)
        let tunicGrad = ctx.createLinearGradient(-16, -6, 16, 22);
        tunicGrad.addColorStop(0, '#ffb703'); // bright orange-yellow
        tunicGrad.addColorStop(1, '#fb8500'); // deep orange
        ctx.fillStyle = tunicGrad;
        ctx.beginPath();
        ctx.ellipse(0, 8, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tiger stripes: dark brown/black angled wedges along the sides of the tunic
        ctx.fillStyle = '#1e140a';
        ctx.beginPath();
        // Left stripes
        ctx.moveTo(-16, 2); ctx.lineTo(-8, 5); ctx.lineTo(-15, 8); ctx.closePath();
        ctx.moveTo(-15, 10); ctx.lineTo(-6, 11); ctx.lineTo(-13, 13); ctx.closePath();
        // Right stripes
        ctx.moveTo(16, 2); ctx.lineTo(8, 5); ctx.lineTo(15, 8); ctx.closePath();
        ctx.moveTo(15, 10); ctx.lineTo(6, 11); ctx.lineTo(13, 13); ctx.closePath();
        // Center-bottom stripe
        ctx.moveTo(-4, 20); ctx.lineTo(0, 12); ctx.lineTo(4, 20); ctx.closePath();
        ctx.fill();

        // Flesh skin color
        ctx.fillStyle = skinGrad;

        // Legs animation based on state
        let legOffsetLeft = 0;
        let legOffsetRight = 0;
        if (state === 'walk') {
            const cycle = Math.sin(tick * 0.25);
            legOffsetLeft = cycle * 7;
            legOffsetRight = -cycle * 7;
        } else if (state === 'jump') {
            legOffsetLeft = -3;
            legOffsetRight = -5;
        } else if (state === 'duck') {
            legOffsetLeft = -1;
            legOffsetRight = -1;
        }

        // Draw Legs (thick caveman legs)
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        
        // Left Leg
        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.arc(-7 + legOffsetLeft, 19, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right Leg
        ctx.beginPath();
        ctx.arc(7 + legOffsetRight, 19, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Head (large, funny round head with gradient shading)
        let headY = -12;
        if (state === 'duck') headY = -5; // Lower head when crouching
        
        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.arc(0, headY, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Face details (Eyes, nose, beard)
        // Beard / Beard stubble
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(4, headY + 5, 8, 0, Math.PI);
        ctx.fill();

        // Nose (big bulbous nose with gradient highlight)
        let noseGrad = ctx.createLinearGradient(5, headY - 4, 14, headY + 5);
        noseGrad.addColorStop(0, '#ffbe9e');
        noseGrad.addColorStop(1, '#cc5d33');
        ctx.fillStyle = noseGrad;
        ctx.beginPath();
        ctx.arc(9, headY + 1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eyes (white with black pupil looking forward)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, headY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(5.5, headY - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Blue stone chest necklace
        ctx.strokeStyle = '#2a1a08';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, headY + 9, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        // Blue stones
        ctx.fillStyle = '#00b4d8'; // cyan/blue stone
        ctx.beginPath();
        ctx.arc(-4, headY + 16, 2, 0, Math.PI*2);
        ctx.arc(0, headY + 17.5, 2.5, 0, Math.PI*2);
        ctx.arc(4, headY + 16, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#90e0ef'; // highlight on central stone
        ctx.beginPath();
        ctx.arc(0.5, headY + 17.0, 0.8, 0, Math.PI*2);
        ctx.fill();

        // Option 1: Wild Shaman spiky front hair overlay
        let frontHairGrad = ctx.createLinearGradient(-13, headY - 17, 8, headY - 6);
        frontHairGrad.addColorStop(0, '#3d2b20');
        frontHairGrad.addColorStop(1, '#150d0a');
        ctx.fillStyle = frontHairGrad;
        ctx.strokeStyle = '#050302';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-13, headY - 8);
        ctx.lineTo(-9, headY - 15);
        ctx.lineTo(-5, headY - 11);
        ctx.lineTo(-1, headY - 19);
        ctx.lineTo(4, headY - 12);
        ctx.lineTo(8, headY - 14);
        ctx.lineTo(6, headY - 8);
        ctx.lineTo(1, headY - 6);
        ctx.lineTo(-5, headY - 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Spiky highlights in hair
        ctx.strokeStyle = '#6d4c3a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-11, headY - 11); ctx.lineTo(-9, headY - 14);
        ctx.moveTo(-3, headY - 13); ctx.lineTo(-1, headY - 17);
        ctx.moveTo(5, headY - 10); ctx.lineTo(7, headY - 13);
        ctx.stroke();

        // Bone decoration in hair (larger, detailed)
        let boneGrad = ctx.createLinearGradient(-15, headY - 16, 5, headY - 7);
        boneGrad.addColorStop(0, '#ffffff');
        boneGrad.addColorStop(1, '#e0e0d8');
        ctx.fillStyle = boneGrad;
        ctx.beginPath();
        ctx.ellipse(-5, headY - 14, 10, 4, Math.PI/6, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#2a221d';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Bone knobs
        ctx.fillStyle = '#f5f5f0';
        ctx.beginPath();
        ctx.arc(-13, headY - 17, 3.5, 0, Math.PI * 2);
        ctx.arc(-14, headY - 12, 3.5, 0, Math.PI * 2);
        ctx.arc(3, headY - 10, 3.5, 0, Math.PI * 2);
        ctx.arc(1, headY - 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw arms / club
        let armAngle = 0.5; // Default hanging arm
        let armX = -3;
        let armY = 4;
        let clubRotation = 0.2;
        let clubX = 12;
        let clubY = -5;

        if (state === 'hit') {
            // Club swings forward
            const hitProgress = (tick % 10) / 10; // swing sequence
            armAngle = -Math.PI / 4 + hitProgress * (Math.PI * 0.8);
            clubRotation = armAngle + Math.PI / 4;
            clubX = 14 * Math.cos(armAngle);
            clubY = 14 * Math.sin(armAngle) - 2;
        } else if (state === 'jump') {
            armAngle = -Math.PI / 3;
            clubRotation = -Math.PI / 6;
            clubX = 10;
            clubY = -12;
        } else if (state === 'duck') {
            armAngle = 0.8;
            clubRotation = 0.5;
            clubX = 12;
            clubY = 8;
        }

        // Draw bulky wood-grained club (Option 1: Wild Shaman design)
        ctx.save();
        ctx.translate(clubX, clubY);
        ctx.rotate(clubRotation);
        
        // Club gradient (textured dark wood)
        let clubGrad = ctx.createLinearGradient(-6, -24, 6, 0);
        clubGrad.addColorStop(0, '#5c4033'); // dark brown
        clubGrad.addColorStop(0.5, '#7c5c43'); // medium wood brown
        clubGrad.addColorStop(1, '#3d251d'); // shadow brown
        
        ctx.fillStyle = clubGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-8, -18);
        ctx.ellipse(0, -22, 11, 9, 0, 0, Math.PI * 2); // Thicker top
        ctx.lineTo(6, -4);
        ctx.closePath();
        ctx.fill();
        
        // Wood grain details
        ctx.strokeStyle = '#281710';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-1, -6); ctx.lineTo(-2, -18);
        ctx.moveTo(2, -8); ctx.lineTo(3, -16);
        ctx.moveTo(-4, -22); ctx.quadraticCurveTo(0, -25, 4, -21);
        ctx.stroke();

        // Redraw outline
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-8, -18);
        ctx.ellipse(0, -22, 11, 9, 0, 0, Math.PI * 2);
        ctx.lineTo(6, -4);
        ctx.closePath();
        ctx.stroke();

        // Leather straps wrapped around the club
        ctx.strokeStyle = '#b5835a'; // light leather brown
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-5, -8); ctx.lineTo(4, -12);
        ctx.moveTo(-6, -13); ctx.lineTo(5, -17);
        ctx.stroke();

        // Spiky raw grey stones (Option 1 stone spikes)
        let stoneGrad = ctx.createLinearGradient(-10, -26, 10, -20);
        stoneGrad.addColorStop(0, '#a0a0a0');
        stoneGrad.addColorStop(1, '#505050');
        ctx.fillStyle = stoneGrad;
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1.5;

        // Left spike
        ctx.beginPath();
        ctx.moveTo(-7, -22);
        ctx.lineTo(-14, -20);
        ctx.lineTo(-6, -17);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Right spike
        ctx.beginPath();
        ctx.moveTo(7, -22);
        ctx.lineTo(14, -24);
        ctx.lineTo(6, -17);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Top spike
        ctx.beginPath();
        ctx.moveTo(-3, -29);
        ctx.lineTo(0, -35);
        ctx.lineTo(3, -29);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.restore();

        // Draw arm holding the club (with skin gradient)
        ctx.fillStyle = skinGrad;
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(armX, armY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Club Swing trail effect (몽둥이 궤적 효과)
    drawClubEffect(ctx, x, y, width, height, direction) {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.scale(direction, 1);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(10, -5, 32, -Math.PI / 3, Math.PI / 3);
        ctx.lineTo(15, 10);
        ctx.arc(10, -5, 20, Math.PI / 3, -Math.PI / 3, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    },

    // Dino Enemy (초록 아기 공룡)
    drawDinosaur(ctx, x, y, width, height, tick, isDamaged = false, direction = -1) {
        this.setupTransform(ctx, x, y, width, height, direction); // Face left by default

        if (isDamaged) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 10;
        }

        // Apply scale multiplier for rendering arbitrary sizes
        ctx.scale(width / 38, height / 36);

        // Determine colors based on size (boss is larger)
        const isBoss = width > 50;
        const mainColor = isBoss ? '#9d0208' : '#559c38';
        const bellyColor = isBoss ? '#dc2f02' : '#3a5f28';
        const spotColor = isBoss ? '#ffba08' : '#ff7b00';
        const strokeColor = isBoss ? '#37000a' : '#1e3c15';

        // Legs animation
        const legSwing = Math.sin(tick * 0.2) * 5;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;

        // Back leg
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.arc(-6 - legSwing, 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tail
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.quadraticCurveTo(-22, 6, -24, -2);
        ctx.quadraticCurveTo(-18, -4, -8, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Big round body
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(-2, 3, 14, 11, Math.PI/12, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // spots on back
        ctx.fillStyle = spotColor;
        ctx.beginPath();
        ctx.arc(-8, -2, 2.5, 0, Math.PI*2);
        ctx.arc(-2, -5, 2, 0, Math.PI*2);
        ctx.fill();

        // Head (large dino head)
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(0, -18, 18, 14, [6, 6, 2, 6]);
        ctx.fill();
        ctx.stroke();

        // Mouth line
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(18, -8);
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8, -12, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isBoss ? '#ffd166' : '#000'; // Golden glowing eye for boss
        ctx.beginPath();
        ctx.arc(7.5, -12, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Tiny cute T-rex arm
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(4, 2, 5, 3, Math.PI/4, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Front leg
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(4 + legSwing, 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Stegosaurus (보라빛 판 공룡 - 피격 시 광폭화)
    drawStegosaurus(ctx, x, y, width, height, tick, isDamaged = false, isEnraged = false, direction = -1) {
        this.setupTransform(ctx, x, y, width, height, direction); // Faces left by default

        if (isDamaged) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 10;
        } else if (isEnraged) {
            ctx.shadowColor = '#ef476f';
            ctx.shadowBlur = 8;
        }

        ctx.scale(width / 48, height / 42);

        const bodyColor = isEnraged ? '#7b1fa2' : '#4a266a';
        const plateColor = isEnraged ? '#ff0000' : '#e63946';
        const bellyColor = isEnraged ? '#b800c8' : '#723d9c';
        const strokeColor = '#1d0f2b';

        // Legs animation
        const legSwing = Math.sin(tick * 0.22) * 6;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;

        // Back Legs
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.roundRect(-10 - legSwing, 15, 7, 10, 3);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(8 - legSwing, 15, 7, 10, 3);
        ctx.fill(); ctx.stroke();

        // Spikes on tail
        ctx.fillStyle = '#d1d1d1';
        ctx.beginPath();
        ctx.moveTo(-28, 4); ctx.lineTo(-35, 1); ctx.lineTo(-28, -2);
        ctx.moveTo(-24, 7); ctx.lineTo(-32, 9); ctx.lineTo(-26, 3);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Tail
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-12, 5);
        ctx.quadraticCurveTo(-26, 6, -28, 2);
        ctx.quadraticCurveTo(-22, -3, -10, -3);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Back plates (Red triangles)
        ctx.fillStyle = plateColor;
        const platePositions = [
            {x: -12, y: -8, size: 7},
            {x: -6, y: -12, size: 9},
            {x: 2, y: -13, size: 9},
            {x: 10, y: -10, size: 8},
            {x: 15, y: -6, size: 6}
        ];
        platePositions.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(p.x - p.size/2, p.y);
            ctx.lineTo(p.x, p.y - p.size);
            ctx.lineTo(p.x + p.size/2, p.y);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        });

        // Main Body (Round, heavy)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 4, 17, 13, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Head (Small stegosaurus head)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(14, -6, 11, 8, [4, 4, 2, 4]);
        ctx.fill(); ctx.stroke();

        // Eye
        ctx.fillStyle = isEnraged ? '#ff0000' : '#ffffff';
        ctx.beginPath();
        ctx.arc(20, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        if (isEnraged) {
            ctx.fillStyle = '#ffd166';
            ctx.beginPath();
            ctx.arc(20, -3, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Front Legs
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-6 + legSwing, 15, 7, 10, 3);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(12 + legSwing, 15, 7, 10, 3);
        ctx.fill(); ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Triceratops (뿔 세개 달린 돌진 공룡)
    drawTriceratops(ctx, x, y, width, height, tick, isDamaged = false, isCharging = false, direction = -1) {
        this.setupTransform(ctx, x, y, width, height, direction);

        if (isDamaged) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 10;
        } else if (isCharging) {
            ctx.shadowColor = '#ffd166';
            ctx.shadowBlur = 8;
        }

        ctx.scale(width / 52, height / 42);

        const bodyColor = '#1d3557'; // Deep blue/teal
        const frillColor = '#457b9d'; // Lighter blue/grey frill
        const frillEdgeColor = '#e63946'; // Red ridges on frill
        const hornColor = '#f1faee';
        const strokeColor = '#0b131f';

        // Legs swing
        const legSwing = Math.sin(tick * (isCharging ? 0.4 : 0.2)) * 6;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;

        // Back legs
        ctx.fillStyle = '#112233';
        ctx.beginPath();
        ctx.roundRect(-10 - legSwing, 15, 8, 10, 3);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(10 - legSwing, 15, 8, 10, 3);
        ctx.fill(); ctx.stroke();

        // Tail
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-15, 4);
        ctx.quadraticCurveTo(-26, 8, -28, 3);
        ctx.quadraticCurveTo(-22, -1, -12, -2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 5, 18, 13, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Large Neck Frill (Huge shield shape behind head)
        ctx.fillStyle = frillColor;
        ctx.beginPath();
        ctx.arc(10, -5, 12, -Math.PI * 0.8, Math.PI * 0.2);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Spikes/ridges on frill edge
        ctx.fillStyle = frillEdgeColor;
        for (let a = -Math.PI * 0.8; a < Math.PI * 0.2; a += 0.4) {
            const fx = 10 + Math.cos(a) * 12;
            const fy = -5 + Math.sin(a) * 12;
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI*2);
            ctx.fill(); ctx.stroke();
        }

        // Head
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(12, -2, 12, 12, [2, 6, 2, 2]);
        ctx.fill(); ctx.stroke();

        // Charging eye
        ctx.fillStyle = isCharging ? '#ffb703' : '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(16.5, 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Three Horns (White pointy)
        ctx.fillStyle = hornColor;
        // Two long brow horns
        ctx.beginPath();
        ctx.moveTo(15, -2); ctx.lineTo(24, -8); ctx.lineTo(17, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(13, -4); ctx.lineTo(22, -11); ctx.lineTo(15, -2); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // One short nose horn
        ctx.beginPath();
        ctx.moveTo(22, 4); ctx.lineTo(27, 2); ctx.lineTo(22, 7); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Front legs
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-4 + legSwing, 15, 8, 10, 3);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(14 + legSwing, 15, 8, 10, 3);
        ctx.fill(); ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Ankylosaurus (망치 꼬리 방패 공룡 - 정면 공격 면역)
    drawAnkylosaurus(ctx, x, y, width, height, tick, isDamaged = false, direction = -1) {
        this.setupTransform(ctx, x, y, width, height, direction);

        if (isDamaged) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 10;
        }

        ctx.scale(width / 46, height / 36);

        const armorColor = '#8c5c36'; // Thick brown dome
        const bodyColor = '#a0704c'; // Brown body skin
        const spikeColor = '#d9d9d9'; // Stone grey spikes
        const strokeColor = '#3d2410';

        const legSwing = Math.sin(tick * 0.15) * 4;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;

        // Back feet
        ctx.fillStyle = '#6d4520';
        ctx.beginPath();
        ctx.roundRect(-10 - legSwing, 12, 7, 8, 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(8 - legSwing, 12, 7, 8, 2);
        ctx.fill(); ctx.stroke();

        // Club tail
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-10, 2);
        ctx.quadraticCurveTo(-22, 3, -25, 1);
        ctx.lineTo(-12, -2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Heavy bone club at the end of tail
        ctx.fillStyle = '#5c5c5c';
        ctx.beginPath();
        ctx.arc(-26, 1, 5.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // Club texture line
        ctx.beginPath();
        ctx.moveTo(-28, 1); ctx.lineTo(-24, 1);
        ctx.stroke();

        // Main low body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 3, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Armored Dome Shell (Ankylosaurus carapace)
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.ellipse(0, 1, 16, 9, 0, Math.PI, 0); // top half dome
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Spikes on the shell
        ctx.fillStyle = spikeColor;
        const spikes = [
            {x: -12, y: -5, r: 2},
            {x: -6, y: -8, r: 2.5},
            {x: 0, y: -9, r: 3},
            {x: 6, y: -8, r: 2.5},
            {x: 12, y: -5, r: 2}
        ];
        spikes.forEach(s => {
            ctx.beginPath();
            ctx.moveTo(s.x - 2, s.y);
            ctx.lineTo(s.x, s.y - 4);
            ctx.lineTo(s.x + 2, s.y);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        });

        // Low head
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(12, 1, 10, 8, [2, 5, 2, 4]);
        ctx.fill(); ctx.stroke();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(17, 4, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(17.5, 4, 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Front feet
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-4 + legSwing, 12, 7, 8, 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(12 + legSwing, 12, 7, 8, 2);
        ctx.fill(); ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Tyrannosaurus Rex (Stage 5 / Stage 10 보스 캐릭터)
    drawTyrannosaurus(ctx, x, y, width, height, tick, isDamaged = false, isOpenJaw = false, direction = -1) {
        this.setupTransform(ctx, x, y, width, height, direction);

        if (isDamaged) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowColor = 'rgba(139, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
        }

        ctx.scale(width / 110, height / 100);

        const bodyColor = '#8b2525'; // Dark reddish brown
        const accentColor = '#a83232'; // Underbelly red
        const strokeColor = '#3a0909';

        const legSwing = Math.sin(tick * 0.15) * 8;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;

        // Back massive leg
        ctx.fillStyle = '#5c1313';
        ctx.beginPath();
        ctx.ellipse(-15 - legSwing/2, 28, 12, 22, Math.PI/12, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        // foot
        ctx.beginPath();
        ctx.roundRect(-24 - legSwing/2, 45, 18, 10, [4, 4, 2, 2]);
        ctx.fill(); ctx.stroke();

        // Tail (Thick, massive)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-25, 8);
        ctx.quadraticCurveTo(-75, 15, -80, -5);
        ctx.quadraticCurveTo(-55, -20, -20, -12);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Large body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(-10, -2, 34, 26, Math.PI/12, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();

        // Orange stripes on back
        ctx.fillStyle = '#e76f51';
        ctx.beginPath();
        ctx.moveTo(-35, -15); ctx.lineTo(-28, -25); ctx.lineTo(-24, -13);
        ctx.moveTo(-20, -18); ctx.lineTo(-12, -26); ctx.lineTo(-8, -15);
        ctx.moveTo(-2, -18); ctx.lineTo(6, -24); ctx.lineTo(10, -14);
        ctx.closePath();
        ctx.fill();

        // Re-stroke body outline to hide stripes overlapping edges
        ctx.beginPath();
        ctx.ellipse(-10, -2, 34, 26, Math.PI/12, 0, Math.PI*2);
        ctx.stroke();

        // Underbelly
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.ellipse(-2, 10, 24, 12, Math.PI/8, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();

        // Big Head (Very large jaw)
        // Draw head base
        ctx.fillStyle = bodyColor;
        
        if (isOpenJaw) {
            // Draw upper jaw
            ctx.save();
            ctx.translate(14, -25);
            ctx.rotate(-Math.PI / 10);
            ctx.beginPath();
            ctx.roundRect(0, -18, 42, 20, [10, 10, 4, 4]);
            ctx.fill(); ctx.stroke();
            
            // Eye (glow yellow)
            ctx.fillStyle = '#ffb703';
            ctx.beginPath();
            ctx.arc(14, -8, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(13.5, -8, 2, 0, Math.PI*2);
            ctx.fill();

            // Upper teeth
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let tx = 8; tx < 38; tx += 6) {
                ctx.moveTo(tx, 2); ctx.lineTo(tx + 3, -3); ctx.lineTo(tx + 6, 2);
            }
            ctx.fill();
            ctx.restore();

            // Draw lower jaw (open)
            ctx.save();
            ctx.translate(14, -14);
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.roundRect(0, 0, 36, 12, [2, 2, 8, 8]);
            ctx.fill(); ctx.stroke();
            // Lower teeth
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let tx = 6; tx < 32; tx += 6) {
                ctx.moveTo(tx, 0); ctx.lineTo(tx + 3, 5); ctx.lineTo(tx + 6, 0);
            }
            ctx.fill();
            ctx.restore();

            // Throat (Dark red gap)
            ctx.fillStyle = '#4a0b0b';
            ctx.beginPath();
            ctx.moveTo(14, -28);
            ctx.lineTo(24, -20);
            ctx.lineTo(16, 2);
            ctx.closePath();
            ctx.fill();

        } else {
            // Closed jaw head
            ctx.save();
            ctx.translate(14, -22);
            ctx.beginPath();
            ctx.roundRect(0, -18, 42, 28, [10, 10, 8, 8]);
            ctx.fill(); ctx.stroke();

            // Jaw shut line
            ctx.beginPath();
            ctx.moveTo(12, 2);
            ctx.lineTo(40, 2);
            ctx.stroke();

            // Teeth peaking out
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(18, 2); ctx.lineTo(20, -1); ctx.lineTo(22, 2);
            ctx.moveTo(28, 2); ctx.lineTo(30, -1); ctx.lineTo(32, 2);
            ctx.fill();

            // Eye (glow yellow)
            ctx.fillStyle = '#ffb703';
            ctx.beginPath();
            ctx.arc(14, -8, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(13.5, -8, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        // Tiny T-rex claws (moving slightly with tick)
        const clawWiggle = Math.sin(tick * 0.3) * 4;
        ctx.fillStyle = bodyColor;
        ctx.save();
        ctx.translate(18, -4);
        ctx.rotate(Math.PI/6 + clawWiggle * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        // fingers
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(6, -1); ctx.lineTo(10, -2); ctx.lineTo(7, 1);
        ctx.moveTo(6, 1); ctx.lineTo(9, 3); ctx.lineTo(5, 2);
        ctx.fill();
        ctx.restore();

        // Front massive leg (closest to camera)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(-8 + legSwing/2, 26, 13, 23, -Math.PI/12, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        // foot
        ctx.beginPath();
        ctx.roundRect(-16 + legSwing/2, 45, 19, 10, [4, 4, 2, 2]);
        ctx.fill(); ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Flying Pterodactyl Enemy (빨간 익룡)
    drawPterodactyl(ctx, x, y, width, height, tick, direction = -1) {
        this.setupTransform(ctx, x, y, width, height, direction);

        const wingFlap = Math.sin(tick * 0.25) * 12;

        ctx.strokeStyle = '#5a131a';
        ctx.lineWidth = 2.5;

        // Wings (behind)
        ctx.fillStyle = '#b23a48';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -15 - wingFlap);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail
        ctx.fillStyle = '#d94d5b';
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(-18, 5);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();

        // Body
        ctx.fillStyle = '#d94d5b';
        ctx.beginPath();
        ctx.ellipse(0, 2, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head + beak (Long pointy beak)
        ctx.fillStyle = '#d94d5b';
        ctx.beginPath();
        ctx.moveTo(4, -3);
        ctx.lineTo(24, 0); // Beak tip
        ctx.lineTo(4, 5);
        ctx.lineTo(-2, -8); // Crest behind head
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Beak color highlight (yellow tip)
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.moveTo(14, -1);
        ctx.lineTo(24, 0);
        ctx.lineTo(14, 2);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(3, -1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(2.5, -1, 1, 0, Math.PI * 2);
        ctx.fill();

        // Wings (front)
        ctx.fillStyle = '#d94d5b';
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(10, -18 + wingFlap);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        this.restoreTransform(ctx);
    },

    // Spider hanging from ceiling or walking
    drawSpider(ctx, x, y, width, height, tick) {
        ctx.save();
        ctx.translate(x + width/2, y + height/2);

        // Hanging thread
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(0, -4);
        ctx.stroke();

        const legCycle = Math.sin(tick * 0.15) * 4;

        ctx.strokeStyle = '#221a30';
        ctx.lineWidth = 3;

        // Draw 8 legs
        const legOffsets = [-12, -6, 6, 12];
        legOffsets.forEach((ox, idx) => {
            const side = idx < 2 ? -1 : 1;
            // Leg left
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(ox * 1.5, -8 + legCycle * side, ox * 1.8, 10 - legCycle * side);
            ctx.stroke();
        });

        // Spider Body
        ctx.fillStyle = '#3a2d54';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a102b';
        ctx.stroke();

        // Spider Head
        ctx.fillStyle = '#221a30';
        ctx.beginPath();
        ctx.arc(0, 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eyes
        ctx.fillStyle = '#ef476f';
        ctx.beginPath();
        ctx.arc(-2, 6, 1.2, 0, Math.PI*2);
        ctx.arc(2, 6, 1.2, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    },

    // Draw Meat Item (고인돌 시그니처 뼈다귀 고기)
    drawMeat(ctx, x, y, width, height) {
        ctx.save();
        ctx.translate(x + width/2, y + height/2);

        // Draw bones sticking out
        ctx.fillStyle = '#e8e8e8';
        ctx.strokeStyle = '#a8a8a8';
        ctx.lineWidth = 1.5;

        // Left bone knobs
        ctx.beginPath();
        ctx.arc(-13, -1, 3.5, 0, Math.PI*2);
        ctx.arc(-13, 3, 3.5, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        // Right bone knobs
        ctx.beginPath();
        ctx.arc(13, -1, 3.5, 0, Math.PI*2);
        ctx.arc(13, 3, 3.5, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();

        // Bone bar
        ctx.fillRect(-12, -1, 24, 3);

        // Thick delicious brown-red meat chunks
        ctx.fillStyle = '#c84b31';
        ctx.beginPath();
        ctx.roundRect(-9, -8, 18, 16, 6);
        ctx.fill();
        
        ctx.strokeStyle = '#5a1307';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Meat texture / highlight bone
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.ellipse(-3, -3, 5, 2, Math.PI/6, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.restore();
    },

    // Draw Fruit (Banana/Cherry/Apple)
    drawFruit(ctx, x, y, width, height, type = 'cherry') {
        ctx.save();
        ctx.translate(x + width/2, y + height/2);

        if (type === 'cherry') {
            // Green stem
            ctx.strokeStyle = '#4f772d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(3, -10);
            ctx.quadraticCurveTo(-4, -6, -5, 2);
            ctx.moveTo(3, -10);
            ctx.quadraticCurveTo(4, -6, 5, 2);
            ctx.stroke();

            // Twin Cherries
            ctx.fillStyle = '#ef476f';
            ctx.beginPath();
            ctx.arc(-5, 4, 5, 0, Math.PI * 2);
            ctx.arc(5, 4, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8b1c36';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(-5, 4, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(5, 4, 5, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Apple
            ctx.fillStyle = '#06d6a0'; // green apple
            ctx.beginPath();
            ctx.arc(-3, 1, 6, 0, Math.PI * 2);
            ctx.arc(3, 1, 6, 0, Math.PI * 2);
            ctx.fill();

            // Stem
            ctx.strokeStyle = '#6d4c41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.quadraticCurveTo(1, -9, 3, -10);
            ctx.stroke();
        }

        ctx.restore();
    },

    // Draw Arrow Projectile
    drawArrow(ctx, x, y, width, height, direction) {
        this.setupTransform(ctx, x, y, width, height, direction);

        ctx.strokeStyle = '#8b5a2b'; // Wooden shaft
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-width/2 + 2, 0);
        ctx.lineTo(width/2 - 4, 0);
        ctx.stroke();

        // Arrowhead (Stone tip)
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.moveTo(width/2 - 4, -4);
        ctx.lineTo(width/2 + 4, 0);
        ctx.lineTo(width/2 - 4, 4);
        ctx.closePath();
        ctx.fill();

        // Fletching (Feathers at the tail)
        ctx.fillStyle = '#ff5e36'; // Orange feather
        ctx.beginPath();
        ctx.moveTo(-width/2 + 2, 0);
        ctx.lineTo(-width/2 - 2, -4);
        ctx.lineTo(-width/2 + 4, -4);
        ctx.lineTo(-width/2 + 6, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-width/2 + 2, 0);
        ctx.lineTo(-width/2 - 2, 4);
        ctx.lineTo(-width/2 + 4, 4);
        ctx.lineTo(-width/2 + 6, 0);
        ctx.closePath();
        ctx.fill();

        this.restoreTransform(ctx);
    },

    // Draw ladder (사다리)
    drawLadder(ctx, x, y, width, height) {
        ctx.save();
        ctx.strokeStyle = '#7c5836';
        ctx.lineWidth = 5;
        ctx.lineCap = 'square';

        // Two vertical beams
        ctx.beginPath();
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + 5, y + height);
        ctx.moveTo(x + width - 5, y);
        ctx.lineTo(x + width - 5, y + height);
        ctx.stroke();

        // Rungs
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#996f47';
        for (let ry = y + 8; ry < y + height; ry += 16) {
            ctx.beginPath();
            ctx.moveTo(x + 5, ry);
            ctx.lineTo(x + width - 5, ry);
            ctx.stroke();
        }
        ctx.restore();
    },

    // Background Elements: Trees (나무)
    drawTree(ctx, x, y, height = 120) {
        ctx.save();
        
        // Trunk
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 5, y - height);
        ctx.lineTo(x + 5, y - height);
        ctx.lineTo(x + 8, y);
        ctx.closePath();
        ctx.fill();

        // Foliage (fluffy retro green circles)
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.arc(x - 15, y - height, 25, 0, Math.PI*2);
        ctx.arc(x + 15, y - height, 25, 0, Math.PI*2);
        ctx.arc(x, y - height - 15, 30, 0, Math.PI*2);
        ctx.fill();

        // Highlight layer
        ctx.fillStyle = '#4c8c3c';
        ctx.beginPath();
        ctx.arc(x - 10, y - height, 18, 0, Math.PI*2);
        ctx.arc(x + 10, y - height, 18, 0, Math.PI*2);
        ctx.arc(x, y - height - 10, 22, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    },

    // Background Clouds (구름)
    drawCloud(ctx, x, y, width = 80) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        const r = width / 4;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r * 1.2, y - r * 0.3, r * 1.2, 0, Math.PI * 2);
        ctx.arc(x + r * 2.4, y, r * 0.9, 0, Math.PI * 2);
        ctx.rect(x, y - r * 0.5, r * 2.4, r * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    // Cave backgrounds (Stalactites / Stalagmites)
    drawCaveDecor(ctx, x, y, height, isCeiling = true, isVolcanic = false, isIce = false, isCyber = false, isCastle = false) {
        ctx.save();
        
        let fill = '#231c30';
        let stroke = '#14101d';
        
        if (isVolcanic) {
            fill = '#530f0f';
            stroke = '#ff5e36';
        } else if (isIce) {
            fill = '#90e0ef';
            stroke = '#ffffff';
        } else if (isCyber) {
            fill = '#1d0f30';
            stroke = '#70d6ff';
        } else if (isCastle) {
            fill = '#1e0505';
            stroke = '#ef476f';
        }
        
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (isCeiling) {
            ctx.moveTo(x - 15, y);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + 15, y);
        } else {
            ctx.moveTo(x - 15, y);
            ctx.lineTo(x, y - height);
            ctx.lineTo(x + 15, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
};

window.Sprites = Sprites;
