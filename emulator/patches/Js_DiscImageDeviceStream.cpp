// Adaptado do Play!: BSD 2-clause, ver LICENSE-Play.txt.
#include "Js_DiscImageDeviceStream.h"
#include <stdexcept>
#include <cassert>
#include <limits>
#include <emscripten.h>
#include <unistd.h>

uint64 CJsDiscImageDeviceStream::GetDiscSize()
{
    if(!m_sizeKnown)
    {
        const uint32 low = MAIN_THREAD_EM_ASM_INT({ return Module.discImageDevice.getFileSize(); });
        const uint32 high = MAIN_THREAD_EM_ASM_INT({ return Module.discImageDevice.getFileSize() / 4294967296; });
        m_discSize = static_cast<uint64>(low) | (static_cast<uint64>(high) << 32);
        m_sizeKnown = true;
    }
    return m_discSize;
}

void CJsDiscImageDeviceStream::Seek(int64 position, Framework::STREAM_SEEK_DIRECTION whence)
{
    switch(whence)
    {
    case Framework::STREAM_SEEK_SET: m_position = position; break;
    case Framework::STREAM_SEEK_CUR: m_position += position; break;
    case Framework::STREAM_SEEK_END: m_position = GetDiscSize(); break;
    }
}

uint64 CJsDiscImageDeviceStream::Tell() { return m_position; }

void CJsDiscImageDeviceStream::ReadFromJs(void* buffer, uint64 position, uint32 size)
{
    if(size == 0) return;
    const uint32 low = static_cast<uint32>(position);
    const uint32 high = static_cast<uint32>(position >> 32);
    MAIN_THREAD_EM_ASM({
        const position = ($1 >>> 0) + (($2 >>> 0) * 4294967296);
        Module.discImageDevice.read($0, position, $3);
    }, buffer, low, high, size);
    while(!MAIN_THREAD_EM_ASM_INT({ return Module.discImageDevice.isDone(); }))
        usleep(100);
}

uint64 CJsDiscImageDeviceStream::Read(void* buffer, uint64 size)
{
    if(size == 0) return 0;
    if(size > std::numeric_limits<uint32>::max()) throw std::runtime_error("Disc read is too large");
    m_readCache.Read(buffer, m_position, size, GetDiscSize(),
        [this](std::uint8_t* destination, std::uint64_t offset, std::uint64_t count) {
            ReadFromJs(destination, offset, static_cast<uint32>(count));
        });
    m_position += size;
    return size;
}

uint64 CJsDiscImageDeviceStream::Write(const void*, uint64)
{
    throw std::runtime_error("Not supported.");
}
bool CJsDiscImageDeviceStream::IsEOF() { return m_position >= GetDiscSize(); }
void CJsDiscImageDeviceStream::Flush() {}
