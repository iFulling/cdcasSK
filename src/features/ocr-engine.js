import { Logger } from "../core/logger.js";
import { ConfigManager } from "../core/config-manager.js";

export class LocalOcrEngine {
    constructor(ui) {
        this.ui = ui;
        this.session = null;
        this.charsets = [];
        this.initialized = false;
        this.dbName = "iFulling_OCR_DB";
        this.storeName = "models";

        const GH_USER = "iFulling";
        const GH_REPO = "cdcasSK";
        const GH_BRANCH = "main";
        const GH_DIR = "onnx";
        const cdnPrefixes = [
            `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/${GH_DIR}/`,
            `https://cdn.jsdelivr.net/gh/${GH_USER}/${GH_REPO}@${GH_BRANCH}/${GH_DIR}/`,
            `https://gh-proxy.org/https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/${GH_DIR}/`,
            `https://ghfast.top/https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/${GH_DIR}/`,
            `https://ghproxy.com/https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/${GH_DIR}/`,
            `https://raw.kkgithub.com/${GH_USER}/${GH_REPO}/${GH_BRANCH}/${GH_DIR}/`
        ];


        this.modelUrls = cdnPrefixes.map(prefix => prefix + "common.onnx");
        this.charsetsUrls = cdnPrefixes.map(prefix => prefix + "charsets.json");
    }

    _openDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => resolve(null);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async _getFromDB(key) {
        try {
            const db = await this._openDB();
            if (!db) return null;
            return new Promise(resolve => {
                const transaction = db.transaction([this.storeName], "readonly");
                const store = transaction.objectStore(this.storeName);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        } catch { return null; }
    }

    async _saveToDB(key, data) {
        try {
            const db = await this._openDB();
            if (!db) return false;
            return new Promise(resolve => {
                const transaction = db.transaction([this.storeName], "readwrite");
                const store = transaction.objectStore(this.storeName);
                const req = store.put(data, key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            });
        } catch { return false; }
    }

    async fetchWithFallback(urls, responseType = 'arraybuffer', cacheKey = null) {
        if (cacheKey) {
            const cached = await this._getFromDB(cacheKey);
            if (cached) {
                Logger.info(`读取视觉模型数据：${cacheKey}`);
                if (this.ui) this.ui.updateStatus(`[缓存] 命中视觉模型：${cacheKey}`);
                return cached;
            }
        }

        for (const url of urls) {
            try {
                Logger.warn(`正在尝试请求视觉识别模型：${url}`);
                const response = await fetch(url);
                if (!response.ok) continue;

                Logger.info(`视觉识别模型请求成功，下载中......`);

                if (responseType === 'json') {
                    const data = await response.json();
                    if (cacheKey) await this._saveToDB(cacheKey, data);
                    return data;
                }

                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                let loaded = 0;
                const chunks = [];
                const reader = response.body.getReader();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    loaded += value.length;

                    if (this.ui) {
                        if (total) {
                            const percent = ((loaded / total) * 100).toFixed(1);
                            this.ui.updateStatus(`视觉识别模型下载进度: ${percent}% (已下载 ${(loaded / 1024 / 1024).toFixed(1)}MB)`);
                        } else {
                            this.ui.updateStatus(`正在下载视觉识别模型: ${(loaded / 1024 / 1024).toFixed(1)}MB`);
                        }
                    }
                }

                const arrayBuffer = new Uint8Array(loaded);
                let offset = 0;
                for (let c of chunks) {
                    arrayBuffer.set(c, offset);
                    offset += c.length;
                }

                if (cacheKey) await this._saveToDB(cacheKey, arrayBuffer.buffer);
                return arrayBuffer.buffer;
            } catch {
                Logger.warn(`从 ${url} 获取失败，尝试下一个...`);
            }
        }
        throw new Error("所有 CDN 下载失败，请检查网络！");
    }

    async init() {
        if (this.initialized) return;
        Logger.info("正在加载视觉识别模型与引擎...");
        if (this.ui) this.ui.updateStatus("开始加载视觉识别模型...");
        try {
            ort.env.wasm.numThreads = 1;
            let wasmBuffer = await this._getFromDB("ort-wasm.wasm");
            if (wasmBuffer) {
                Logger.info("从本地缓存读取 WASM 引擎...");
            } else {
                if (!ConfigManager.autoImportModels) {
                    Logger.warn("本地没有 WASM 引擎，且自动导入已关闭，无法继续加载");
                    if (this.ui) this.ui.updateStatus("缺少 WASM 引擎，请手动导入");
                    return;
                }
                Logger.warn("未找到本地 WASM 引擎，正在通过网络下载并缓存 (只需一次)...");
                if (this.ui) this.ui.updateStatus("正在下载 WASM 引擎...");
                const wasmFallbackUrls = [
                    "https://registry.npmmirror.com/onnxruntime-web/1.17.0/files/dist/ort-wasm.wasm",
                    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm",
                    "https://unpkg.com/onnxruntime-web@1.17.0/dist/ort-wasm.wasm"
                ];
                wasmBuffer = await this.fetchWithFallback(wasmFallbackUrls, 'arraybuffer', 'ort-wasm.wasm');
                Logger.info("WASM 引擎下载并缓存成功！");
            }
            if (wasmBuffer) {
                const wasmBlob = new Blob([wasmBuffer], { type: 'application/wasm' });
                const wasmUrl = URL.createObjectURL(wasmBlob);
                ort.env.wasm.wasmPaths = {
                    'ort-wasm.wasm': wasmUrl,
                    'ort-wasm-simd.wasm': wasmUrl,
                    'ort-wasm-threaded.wasm': wasmUrl,
                    'ort-wasm-simd-threaded.wasm': wasmUrl
                };
            } else {
                throw new Error("WASM 引擎获取失败，所有 CDN 均不可用");
            }
            let modelBuffer = await this._getFromDB("common.onnx");
            if (!modelBuffer) {
                if (!ConfigManager.autoImportModels) {
                    Logger.warn("本地没有视觉模型，且自动导入已关闭，无法继续加载");
                    if (this.ui) this.ui.updateStatus("缺少视觉模型，请手动导入");
                    return;
                }
                modelBuffer = await this.fetchWithFallback(this.modelUrls, 'arraybuffer', 'common.onnx');
            }
            let charsetsData = await this._getFromDB("charsets.json");
            if (!charsetsData) {
                if (!ConfigManager.autoImportModels) {
                    Logger.warn("本地没有字符集，且自动导入已关闭，无法继续加载");
                    if (this.ui) this.ui.updateStatus("缺少字符集，请手动导入");
                    return;
                }
                charsetsData = await this.fetchWithFallback(this.charsetsUrls, 'json', 'charsets.json');
            }
            this.charsets = charsetsData;
            if (this.ui) this.ui.updateStatus("正在构建推理模型...");
            this.session = await ort.InferenceSession.create(modelBuffer, { executionProviders: ['wasm'] });
            this.initialized = true;
            Logger.info("视觉识别模型完全加载完毕！");
            if (this.ui) this.ui.updateStatus("视觉识别核心加载完毕可用！");
        } catch (e) {
            Logger.error("视觉识别模型初始化失败：" + e.message);
            if (this.ui) this.ui.updateStatus("视觉识别模型失败！");
        }
    }

    preprocess(imgElement) {
        const canvas = document.createElement("canvas");
        const width = imgElement.naturalWidth || imgElement.width;
        const height = imgElement.naturalHeight || imgElement.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(imgElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);

        const gray = new Float32Array(width * height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3] / 255;
            const bg = 255 * (1 - a);
            gray[i / 4] = (0.2126 * (r * a + bg) + 0.7152 * (g * a + bg) + 0.0722 * (b * a + bg)) / 255;
        }

        const targetHeight = 64;
        const targetWidth = Math.floor(width * (targetHeight / height));
        const resized = new Float32Array(targetWidth * targetHeight);

        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const srcX = x * (width / targetWidth);
                const srcY = y * (height / targetHeight);
                const x1 = Math.floor(srcX), x2 = Math.min(x1 + 1, width - 1);
                const y1 = Math.floor(srcY), y2 = Math.min(y1 + 1, height - 1);
                const dx = srcX - x1, dy = srcY - y1;

                const val = gray[y1 * width + x1] * (1 - dx) * (1 - dy) +
                    gray[y1 * width + x2] * dx * (1 - dy) +
                    gray[y2 * width + x1] * (1 - dx) * dy +
                    gray[y2 * width + x2] * dx * dy;
                resized[y * targetWidth + x] = val;
            }
        }

        return { tensorData: resized, width: targetWidth };
    }

    async recognize(imgElement) {
        if (!this.initialized) await this.init();
        if (!this.session) return null;

        try {
            const { tensorData, width } = this.preprocess(imgElement);
            const tensor = new ort.Tensor("float32", tensorData, [1, 1, 64, width]);

            const results = await this.session.run({ input1: tensor });
            const output = results.output.data;

            const text = [];
            let lastIndex = -1;
            for (let i = 0; i < output.length; i++) {
                const idx = Math.round(Number(output[i]));
                if (idx === lastIndex) continue;
                lastIndex = idx;
                if (idx <= 0 || idx >= this.charsets.length) continue;
                text.push(this.charsets[idx]);
            }
            return text.join("");
        } catch (e) {
            Logger.error("识别出错: " + e.message);
            return null;
        }
    }
}
