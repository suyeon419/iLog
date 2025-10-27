// src/polyfills.js (파일 생성)
(function () {
  if (typeof window === 'undefined') return;

  // 보편적 전역 변수들
  window.global = window.global || window;
  window.self = window.self || window;
  window.globalThis = window.globalThis || window;
  // window.process (일부 라이브러리 참조)
  if (!window.process) window.process = { env: {} };

  // URL / webkitURL 보장 (필요하면)
  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

  // BlobBuilder 폴리필 (구형 API가 필요할 때)
  if (!window.BlobBuilder && !window.WebKitBlobBuilder && !window.MozBlobBuilder) {
    function BlobBuilderPoly() {
      this.parts = [];
    }
    BlobBuilderPoly.prototype.append = function (data) {
      this.parts.push(data);
    };
    BlobBuilderPoly.prototype.getBlob = function (type) {
      return new Blob(this.parts, { type: type || '' });
    };
    window.BlobBuilder = window.BlobBuilder || BlobBuilderPoly;
    window.WebKitBlobBuilder = window.WebKitBlobBuilder || window.BlobBuilder;
    window.MozBlobBuilder = window.MozBlobBuilder || window.BlobBuilder;
  }

  // 안전 장치: globalThis에도 동일 참조
  if (!globalThis.global) globalThis.global = window.global;
  if (!globalThis.process) globalThis.process = window.process;
})();
