#pragma once
// Cache limitado para a ponte de disco Play!/JavaScript. Código Orion.
#include <algorithm>
#include <array>
#include <cstdint>
#include <cstring>

class OrionDiscReadCache
{
public:
    static constexpr std::uint64_t BlockSize = 64 * 1024;

    template <typename Reader>
    void Read(void* destination, std::uint64_t offset, std::uint64_t size,
              std::uint64_t fileSize, Reader&& readSource)
    {
        auto* output = static_cast<std::uint8_t*>(destination);
        if(size == 0) return;
        // Mesmo comportamento do dispositivo JS: além do EOF, fornecer zeros.
        if(offset >= fileSize)
        {
            std::memset(output, 0, static_cast<std::size_t>(size));
            return;
        }
        const auto available = std::min(size, fileSize - offset);
        if(available < size)
            std::memset(output + available, 0, static_cast<std::size_t>(size - available));
        if(available >= BlockSize)
        {
            readSource(output, offset, available);
            return;
        }
        std::uint64_t copied = 0;
        while(copied < available)
        {
            const auto position = offset + copied;
            if(!m_valid || position < m_begin || position >= m_begin + m_length)
            {
                m_begin = (position / BlockSize) * BlockSize;
                m_length = std::min(BlockSize, fileSize - m_begin);
                readSource(m_bytes.data(), m_begin, m_length);
                m_valid = true;
            }
            const auto within = position - m_begin;
            const auto count = std::min(available - copied, m_length - within);
            std::memcpy(output + copied, m_bytes.data() + within, static_cast<std::size_t>(count));
            copied += count;
        }
    }

private:
    std::array<std::uint8_t, BlockSize> m_bytes{};
    std::uint64_t m_begin = 0;
    std::uint64_t m_length = 0;
    bool m_valid = false;
};
