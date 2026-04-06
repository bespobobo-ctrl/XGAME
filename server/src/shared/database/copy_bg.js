const fs = require('fs');
const path = require('path');

const src = "C:/Users/PRESTIGE/.gemini/antigravity/brain/bc5f7068-b6fe-48f2-a95a-087ac7e151c5/planet_club_pro_bg_1775510089201.png";
const dest = path.resolve(__dirname, "../../pc-agent/bg.png");

try {
    const stats = fs.statSync(src);
    console.log(`Source size: ${stats.size} bytes`);
    fs.copyFileSync(src, dest);
    const destStats = fs.statSync(dest);
    console.log(`Dest size: ${destStats.size} bytes. SUCCESS!`);
} catch (e) {
    console.error(`Error copying: ${e.message}`);
}
