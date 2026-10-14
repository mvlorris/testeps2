"""Patch Play! d44bfa18: optional WebGL dual-source blending and highp shaders.
Derived Play! lines keep the project's BSD 2-clause license (LICENSE-Play.txt).
No game-specific addresses, textures or executable modifications.
"""
from pathlib import Path
import sys

root = Path(sys.argv[1])
gs = root / 'Source' / 'gs' / 'GSH_OpenGL'

def replace_once(text, before, after, name):
    count = text.count(before)
    if count != 1:
        raise RuntimeError(f'{name}: expected one anchor, found {count}')
    return text.replace(before, after, 1)

header = (gs / 'GSH_OpenGL.h').read_text()
header = replace_once(header, 'bool m_hasFramebufferFetchExtension = false;',
    'bool m_hasFramebufferFetchExtension = false;\n\tbool m_hasWebDualSourceBlending = false;', 'capability field')

cpp = (gs / 'GSH_OpenGL.cpp').read_text()
cpp = replace_once(cpp, '#ifdef USE_DUALSOURCE_BLENDING\n//Dual source blending constants',
'''#if defined(__EMSCRIPTEN__)
#include <emscripten.h>
// Extension is enabled on the actual canvas by the frontend, before initVm.
// WEBGL_blend_func_extended enumerants; ES3 headers need not declare them.
#define BLEND_SRC_ALPHA (m_hasWebDualSourceBlending ? static_cast<GLenum>(0x8589) : GL_SRC_ALPHA)
#define BLEND_ONE_MINUS_SRC_ALPHA (m_hasWebDualSourceBlending ? static_cast<GLenum>(0x88FB) : GL_ONE_MINUS_SRC_ALPHA)
#elif defined(USE_DUALSOURCE_BLENDING)
//Dual source blending constants''', 'blend factors')
cpp = replace_once(cpp, '\t}\n}\n\nFramework::OpenGl::CBuffer CGSH_OpenGL::GeneratePresentVertexBuffer()',
'''\t}
#if defined(__EMSCRIPTEN__)
    m_hasWebDualSourceBlending = MAIN_THREAD_EM_ASM_INT({
        return (Module.orionGraphics && Module.orionGraphics.dualSource) ? 1 : 0;
    }) != 0;
#endif
}

Framework::OpenGl::CBuffer CGSH_OpenGL::GeneratePresentVertexBuffer()''', 'runtime capability')

shader = (gs / 'GSH_OpenGL_Shader.cpp').read_text()
shader = replace_once(shader,
    'bool useFramebufferFetchDepth = alphaTestCanDiscardDepth && m_hasFramebufferFetchDepthExtension;',
    'bool useFramebufferFetchDepth = alphaTestCanDiscardDepth && m_hasFramebufferFetchDepthExtension;\n\tbool useWebDualSourceBlending = m_hasWebDualSourceBlending && !useFramebufferFetch;', 'shader capability')
shader = replace_once(shader, '\tif(useFramebufferFetch)\n\t{\n\t\tshaderBuilder << "#extension GL_EXT_shader_framebuffer_fetch : require"',
'''\tif(useWebDualSourceBlending)
    {
        shaderBuilder << "#extension GL_EXT_blend_func_extended : require" << std::endl;
    }
\tif(useFramebufferFetch)
\t{
\t\tshaderBuilder << "#extension GL_EXT_shader_framebuffer_fetch : require"''', 'shader extension')
shader = replace_once(shader, '\telse\n\t{\n\t\tshaderBuilder << "out vec4 fragColor;" << std::endl;\n\t}',
'''    else if(useWebDualSourceBlending)
    {
        // WebGL exposes no bindFragDataLocationIndexed API: use ESSL layouts.
        shaderBuilder << "layout(location = 0, index = 0) out vec4 fragColor;" << std::endl;
        shaderBuilder << "layout(location = 0, index = 1) out vec4 blendColor;" << std::endl;
    }
\telse
\t{
\t\tshaderBuilder << "out vec4 fragColor;" << std::endl;
\t}''', 'indexed outputs')
shader = replace_once(shader, '#else\n\tif(useFramebufferFetch)\n\t{\n\t\tshaderBuilder << "\tfloat finalAlpha = textureColor.a;"',
'''#else
    if(useWebDualSourceBlending)
    {
        // Store original alpha, use the second output only for the blend factor.
        shaderBuilder << "float finalAlpha = textureColor.a;" << std::endl;
        shaderBuilder << "blendColor = vec4(0.0, 0.0, 0.0, clamp(textureColor.a * (255.0 / 128.0), 0.0, 1.0));" << std::endl;
    }
    else if(useFramebufferFetch)
\t{
\t\tshaderBuilder << "\tfloat finalAlpha = textureColor.a;"''', 'stored alpha')
precision_count = shader.count('precision mediump float;')
if precision_count != 3:
    raise RuntimeError(f'expected three precision declarations, found {precision_count}')
shader = shader.replace('precision mediump float;', 'precision highp float;')

# Write only after all anchors match: unknown upstream revisions fail closed.
(gs / 'GSH_OpenGL.h').write_text(header)
(gs / 'GSH_OpenGL.cpp').write_text(cpp)
(gs / 'GSH_OpenGL_Shader.cpp').write_text(shader)
print('Applied optional dual-source alpha and three highp fragment shader paths.')
