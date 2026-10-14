#pragma once
// Adaptado do Play!: BSD 2-clause, ver LICENSE-Play.txt.
#include "Stream.h"
#include "OrionDiscReadCache.h"

class CJsDiscImageDeviceStream : public Framework::CStream
{
public:
    virtual ~CJsDiscImageDeviceStream() = default;
    void Seek(int64, Framework::STREAM_SEEK_DIRECTION) override;
    uint64 Tell() override;
    uint64 Read(void*, uint64) override;
    uint64 Write(const void*, uint64) override;
    bool IsEOF() override;
    void Flush() override;

private:
    void ReadFromJs(void*, uint64, uint32);
    uint64 GetDiscSize();
    uint64 m_position = 0;
    uint64 m_discSize = 0;
    bool m_sizeKnown = false;
    OrionDiscReadCache m_readCache;
};
