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

    // Draw the main character: Caveman (고인돌 원시인)
    drawCaveman(ctx, x, y, width, height, state, direction, tick, isFlashed = false) {
        this.setupTransform(ctx, x, y, width, height, direction);

        // Flash red if damaged
        if (isFlashed) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowBlur = 0;
        }

        // Draw wild hair behind (brown, spiky)
        ctx.fillStyle = '#50301a';
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(-5, -28);
        ctx.lineTo(8, -25);
        ctx.lineTo(18, -12);
        ctx.lineTo(22, 10);
        ctx.lineTo(5, 5);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();

        // Caveman body / clothes (Leopard print tunic: orange/yellow with dark dots)
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath();
        ctx.ellipse(0, 8, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Leopard spots
        ctx.fillStyle = '#5e3e18';
        ctx.beginPath();
        ctx.arc(-8, 6, 2.5, 0, Math.PI * 2);
        ctx.arc(4, 12, 2, 0, Math.PI * 2);
        ctx.arc(6, 4, 3, 0, Math.PI * 2);
        ctx.arc(-3, 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Flesh skin color
        const skinColor = '#ffa47a';
        ctx.fillStyle = skinColor;

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
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-7 + legOffsetLeft, 19, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Right Leg
        ctx.beginPath();
        ctx.arc(7 + legOffsetRight, 19, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Head (large, funny round head)
        let headY = -12;
        if (state === 'duck') headY = -5; // Lower head when crouching
        
        ctx.fillStyle = skinColor;
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

        // Nose (big bulbous nose)
        ctx.fillStyle = '#ff8a5c';
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

        // Funny wild hair overlay on front
        ctx.fillStyle = '#50301a';
        ctx.beginPath();
        ctx.moveTo(-13, headY - 8);
        ctx.lineTo(-2, headY - 17);
        ctx.lineTo(8, headY - 14);
        ctx.lineTo(3, headY - 8);
        ctx.lineTo(-4, headY - 6);
        ctx.closePath();
        ctx.fill();

        // Bone decoration in hair
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-5, headY - 14, 8, 3, Math.PI/6, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Bone knobs
        ctx.beginPath();
        ctx.arc(-11, headY - 16, 2.5, 0, Math.PI * 2);
        ctx.arc(-12, headY - 12, 2.5, 0, Math.PI * 2);
        ctx.arc(2, headY - 11, 2.5, 0, Math.PI * 2);
        ctx.arc(1, headY - 7, 2.5, 0, Math.PI * 2);
        ctx.fill();

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

        // Draw wooden club (크고 우락부락한 돌/나무 몽둥이)
        ctx.save();
        ctx.translate(clubX, clubY);
        ctx.rotate(clubRotation);
        
        // Club texture
        ctx.fillStyle = '#9b724c'; // Light brown
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-6, -20);
        ctx.ellipse(0, -22, 9, 7, 0, 0, Math.PI * 2); // Thicker top
        ctx.lineTo(4, -4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#331d10';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Club nails/spikes (Retro spikes)
        ctx.fillStyle = '#e5e5e5';
        ctx.beginPath();
        ctx.moveTo(5, -24); ctx.lineTo(10, -26); ctx.lineTo(6, -21);
        ctx.moveTo(-5, -23); ctx.lineTo(-10, -21); ctx.lineTo(-6, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Draw arm holding the club
        ctx.fillStyle = skinColor;
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
    drawDinosaur(ctx, x, y, width, height, tick, isDamaged = false) {
        this.setupTransform(ctx, x, y, width, height, -1); // Face left by default

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

    // Flying Pterodactyl Enemy (빨간 익룡)
    drawPterodactyl(ctx, x, y, width, height, tick) {
        this.setupTransform(ctx, x, y, width, height, -1);

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
    drawCaveDecor(ctx, x, y, height, isCeiling = true, isVolcanic = false, isIce = false) {
        ctx.save();
        
        let fill = '#231c30';
        let stroke = '#14101d';
        
        if (isVolcanic) {
            fill = '#530f0f';
            stroke = '#ff5e36';
        } else if (isIce) {
            fill = '#90e0ef';
            stroke = '#ffffff';
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
