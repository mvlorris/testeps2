// Adaptado do DiscImageDevice.ts do Play! (licença BSD de 2 cláusulas; ver LICENSE-Play.txt).
// A ponte C++ consulta read(), isDone() e getFileSize() na thread principal.
export class DiscImageDevice {
  constructor(module, { onReadError = () => {}, onProgress = () => {} } = {}) {
    this.module = module;
    this.file = null;
    this.doneFlag = true;
    this.error = null;
    this.bytesRead = 0;
    this.readCount = 0;
    this.maxBlockBytes = 1024 * 1024;
    this.diskBytesRead = 0;
    this.cache = new Map();
    this.maxCachedBlocks = 4;
    this.onReadError = onReadError;
    this.onProgress = onProgress;
  }

  setFile(file) {
    this.file = file;
    this.error = null;
    this.bytesRead = 0;
    this.readCount = 0;
    this.diskBytesRead = 0;
    this.cache.clear();
    this.doneFlag = true;
  }

  getFileSize() {
    if (!this.file) throw new Error('Selecione um arquivo de disco.');
    return this.file.size;
  }

  isDone() { return this.doneFlag; }

  read(dstPtr, offset, size) {
    // Emscripten pode entregar os inteiros i32 como números negativos.
    const ptr = dstPtr >>> 0;
    const length = size >>> 0;
    this.doneFlag = false;
    void this.readBlocks(ptr, offset, length);
  }

  async readBlocks(ptr, offset, length) {
    try {
      if (this.error) throw this.error;
      if (!this.file) throw new Error('Arquivo do disco não selecionado.');
      if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Posição do disco inválida.');
      if (ptr + length > this.module.HEAPU8.length) throw new Error('Buffer do emulador fora dos limites.');
      // Preenche a parte além do EOF com zeros, como o dispositivo oficial.
      this.module.HEAPU8.fill(0, ptr, ptr + length);
      const available = Math.max(0, Math.min(length, this.file.size - offset));
      for (let done = 0; done < available;) {
        const position = offset + done;
        const blockStart = Math.floor(position / this.maxBlockBytes) * this.maxBlockBytes;
        let data = this.cache.get(blockStart);
        if (!data) {
          const blockEnd = Math.min(blockStart + this.maxBlockBytes, this.file.size);
          const buffer = await this.file.slice(blockStart, blockEnd).arrayBuffer();
          if (buffer.byteLength !== blockEnd - blockStart) throw new Error('A leitura do disco foi interrompida.');
          data = new Uint8Array(buffer);
          this.diskBytesRead += data.byteLength;
        }
        // Promover o bloco para o fim da LRU. Limitar o cache a 4 MiB.
        this.cache.delete(blockStart);
        this.cache.set(blockStart, data);
        if (this.cache.size > this.maxCachedBlocks) this.cache.delete(this.cache.keys().next().value);
        const withinBlock = position - blockStart;
        const chunkSize = Math.min(data.length - withinBlock, available - done);
        // Buscar a view novamente: a memória WASM pode ter crescido enquanto aguardamos.
        this.module.HEAPU8.set(data.subarray(withinBlock, withinBlock + chunkSize), ptr + done);
        this.bytesRead += chunkSize;
        done += chunkSize;
      }
      this.readCount += 1;
      this.onProgress({ bytesRead: this.bytesRead, readCount: this.readCount });
    } catch (error) {
      const firstFailure = !this.error;
      this.error = error;
      if (ptr + length <= this.module.HEAPU8.length) this.module.HEAPU8.fill(0, ptr, ptr + length);
      if (firstFailure) this.onReadError(error);
    } finally {
      // Nunca deixar o worker esperando isDone() eternamente após uma falha de File.
      this.doneFlag = true;
    }
  }
}

export async function checkDiscAccess(file) {
  if (!file || file.size < 512) throw new Error('O arquivo selecionado está vazio ou incompleto.');
  // Não carregar a ISO inteira, nem mesmo durante a validação inicial.
  await file.slice(0, Math.min(2048, file.size)).arrayBuffer();
  await file.slice(Math.max(0, file.size - 2048), file.size).arrayBuffer();
  if (/\.iso$/i.test(file.name)) {
    const descriptor = new Uint8Array(await file.slice(32768, 32768 + 2048).arrayBuffer());
    const id = new TextDecoder('ascii').decode(descriptor.slice(1, 6));
    if (id !== 'CD001') throw new Error('O arquivo não apresenta um descritor ISO9660 reconhecível.');
  }
  return { name: file.name, size: file.size };
}
