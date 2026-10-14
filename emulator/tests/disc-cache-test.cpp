#include "OrionDiscReadCache.h"
#include <cassert>
#include <iostream>
#include <vector>

int main()
{
    constexpr std::uint64_t fileSize = 8522792960ULL;
    std::uint64_t requests = 0;
    auto reader = [&requests](std::uint8_t* target, std::uint64_t offset, std::uint64_t size) {
        ++requests;
        for(std::uint64_t index = 0; index < size; ++index)
            target[index] = static_cast<std::uint8_t>((offset + index) % 251);
    };
    OrionDiscReadCache cache;
    std::array<std::uint8_t, 4> tiny{};
    constexpr std::uint64_t reads = 625000;
    for(std::uint64_t index = 0; index < reads; ++index)
    {
        const auto offset = index * 4;
        cache.Read(tiny.data(), offset, tiny.size(), fileSize, reader);
        for(std::uint64_t byte = 0; byte < tiny.size(); ++byte)
            assert(tiny[byte] == (offset + byte) % 251);
    }
    const auto sequentialRequests = requests;
    assert(sequentialRequests <= 39);
    std::array<std::uint8_t, 64> cross{};
    const std::uint64_t offset = 4294967296ULL + 65520;
    cache.Read(cross.data(), offset, cross.size(), fileSize, reader);
    for(std::uint64_t byte = 0; byte < cross.size(); ++byte)
        assert(cross[byte] == (offset + byte) % 251);
    cache.Read(cross.data(), fileSize - 8, cross.size(), fileSize, reader);
    for(std::uint64_t byte = 0; byte < cross.size(); ++byte)
        assert(cross[byte] == (byte < 8 ? (fileSize - 8 + byte) % 251 : 0));
    std::vector<std::uint8_t> large(131072);
    cache.Read(large.data(), 123, large.size(), fileSize, reader);
    for(std::uint64_t byte = 0; byte < large.size(); ++byte)
        assert(large[byte] == (123 + byte) % 251);
    std::cout << "{\"passed\":true,\"syntheticSmallReads\":" << reads
              << ",\"sourceRequests\":" << sequentialRequests
              << ",\"cacheBytes\":" << OrionDiscReadCache::BlockSize
              << ",\"above4GB\":true,\"eof\":true}" << std::endl;
}
