const screenshot = require('screenshot-desktop');
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

// Vanguard 안전: 화면 픽셀 읽기만 사용 (메모리 읽기 X)
class ScreenCapture {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async captureScreen() {
    try {
      const imgBuffer = await screenshot({ format: 'png' });
      return imgBuffer;
    } catch (e) {
      console.error('스크린샷 실패:', e.message);
      return null;
    }
  }

  // TFT 게임 화면에서 골드/레벨/스테이지 영역 추출 (색상 기반)
  async analyzeCurrentScreen() {
    const imgBuffer = await this.captureScreen();
    if (!imgBuffer) return null;

    try {
      const image = await Jimp.read(imgBuffer);
      const width = image.width;
      const height = image.height;

      // TFT UI 위치는 해상도에 따라 다름 (1920x1080 기준)
      const scaleX = width / 1920;
      const scaleY = height / 1080;

      const results = {
        resolution: { width, height },
        detectedElements: []
      };

      // 골드 표시 영역 (하단 중앙 근처)
      const goldRegion = this.extractRegion(image,
        Math.floor(870 * scaleX),
        Math.floor(970 * scaleY),
        Math.floor(100 * scaleX),
        Math.floor(30 * scaleY)
      );

      // 레벨 표시 영역 (하단 좌측)
      const levelRegion = this.extractRegion(image,
        Math.floor(30 * scaleX),
        Math.floor(960 * scaleY),
        Math.floor(60 * scaleX),
        Math.floor(30 * scaleY)
      );

      // 스테이지 표시 영역 (상단 중앙)
      const stageRegion = this.extractRegion(image,
        Math.floor(870 * scaleX),
        Math.floor(10 * scaleY),
        Math.floor(180 * scaleX),
        Math.floor(40 * scaleY)
      );

      // 색상 분석으로 TFT 게임 화면 감지
      const isTFTScreen = await this.detectTFTScreen(image);
      results.isTFTScreen = isTFTScreen;

      if (isTFTScreen) {
        results.detectedElements.push('TFT 게임 화면 감지됨');

        // 골드 영역 밝기 분석 (황금색 = 높은 Red/Green, 낮은 Blue)
        const goldColor = this.analyzeRegionColor(goldRegion);
        if (goldColor.r > 200 && goldColor.g > 150 && goldColor.b < 100) {
          results.detectedElements.push('골드 표시 감지');
          results.goldAreaDetected = true;
        }
      }

      return results;
    } catch (e) {
      console.error('화면 분석 실패:', e.message);
      return { error: e.message };
    }
  }

  extractRegion(image, x, y, w, h) {
    const region = image.clone().crop({
      x: Math.max(0, x),
      y: Math.max(0, y),
      w: Math.max(1, w),
      h: Math.max(1, h)
    });
    return region;
  }

  analyzeRegionColor(image) {
    let r = 0, g = 0, b = 0, count = 0;
    const w = image.width;
    const h = image.height;

    for (let x = 0; x < w; x += 2) {
      for (let y = 0; y < h; y += 2) {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        r += pixel.r;
        g += pixel.g;
        b += pixel.b;
        count++;
      }
    }

    return count > 0
      ? { r: r / count, g: g / count, b: b / count }
      : { r: 0, g: 0, b: 0 };
  }

  // TFT 특유의 UI 색상 패턴 감지
  async detectTFTScreen(image) {
    try {
      const width = image.width;
      const height = image.height;

      // TFT 하단 UI 바 영역 (어두운 배경)
      const bottomBarRegion = this.extractRegion(
        image,
        0,
        Math.floor(height * 0.88),
        width,
        Math.floor(height * 0.12)
      );

      const avgColor = this.analyzeRegionColor(bottomBarRegion);

      // TFT UI 바는 어두운 편 (평균 밝기 낮음)
      const brightness = (avgColor.r + avgColor.g + avgColor.b) / 3;
      return brightness < 80;
    } catch {
      return false;
    }
  }

  // 특정 영역을 파일로 저장 (디버깅용)
  async saveRegionDebug(region, filename) {
    const filePath = path.join(this.tempDir, filename);
    await region.write(filePath);
    return filePath;
  }
}

module.exports = ScreenCapture;
