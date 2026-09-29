import { Color, type IUniform, type Material, type Texture } from "three";

/**
 * Shader sources and uniform factories for the product stage.
 *
 * The materials themselves are declared in JSX with `<shaderMaterial>` so
 * react-three-fiber owns their lifecycle and disposal, and every per-frame
 * write goes through a ref rather than mutating a memoised object.
 *
 * Products are photographic pack shots, so their lighting is already baked
 * in — they render unlit. Scene lights would double-expose them and shift the
 * packaging colour, which the brand direction forbids. The product theme is
 * carried by the atmosphere instead: the glow behind, the reflection beneath.
 */

export const FULLSCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* ---------------------------------------------------------------------------
 * Silhouette — a product whose artwork has not been supplied.
 *
 * Renders the real can silhouette as an unlit dark form with a soft light
 * across the top. It deliberately reads as "not revealed"; no packaging is
 * implied or invented.
 * ------------------------------------------------------------------------ */

export const SILHOUETTE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMask;
  uniform vec3 uDeep;
  uniform vec3 uGlow;
  uniform float uOpacity;
  uniform float uBlur;
  varying vec2 vUv;

  void main() {
    /*
     * Five taps across the direction of travel. The silhouette carries its
     * shape in its alpha, so the blur has to be applied there rather than to
     * a colour that does not exist.
     */
    float alpha = texture2D(uMask, vUv).a * 0.28;
    alpha += texture2D(uMask, vUv + vec2(uBlur, 0.0)).a * 0.2;
    alpha += texture2D(uMask, vUv - vec2(uBlur, 0.0)).a * 0.2;
    alpha += texture2D(uMask, vUv + vec2(uBlur * 2.0, 0.0)).a * 0.16;
    alpha += texture2D(uMask, vUv - vec2(uBlur * 2.0, 0.0)).a * 0.16;
    if (alpha < 0.01) discard;

    /*
     * The page sits on near-black, so an unlit form has to be lifted slightly
     * above it or it disappears. This is a dark graphite body, not a colour:
     * only the rim and the top carry the product theme.
     */
    vec3 body = vec3(0.022, 0.026, 0.030) + uDeep * 0.35;

    /*
     * Light catches the edges. The rim carries most of the readability: at
     * the smaller, dimmer side positions the body alone would disappear into
     * the background, and the contour is what keeps the product legible.
     */
    float rim = pow(abs(vUv.x - 0.5) * 2.0, 2.6);
    // And falls across the shoulder of the can.
    float top = smoothstep(0.38, 1.0, vUv.y);

    vec3 colour = body + uGlow * (rim * 0.85 + top * 0.14);
    gl_FragColor = vec4(colour, alpha * uOpacity);
  }
`;

export function createSilhouetteUniforms(mask: Texture): Record<string, IUniform> {
  return {
    uMask: { value: mask },
    uDeep: { value: new Color("#05070a") },
    uGlow: { value: new Color("#2fd07f") },
    uOpacity: { value: 1 },
    uBlur: { value: 0 },
  };
}

/* ---------------------------------------------------------------------------
 * Reflection — grounds the product without becoming a mirror.
 *
 * Samples the product flipped, fades it with distance and softens it with a
 * cheap four-tap blur. `uTint` lets a silhouette reflect in the active theme
 * rather than as a black shape.
 * ------------------------------------------------------------------------ */

export const REFLECTION_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uTint;
  uniform float uTintAmount;
  uniform float uBlur;
  varying vec2 vUv;

  void main() {
    // vUv.y = 1 sits directly under the product, so sample upside down.
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

    // Blur widens with distance, the way a rough surface scatters.
    float spread = uBlur * (1.0 + (1.0 - vUv.y) * 6.0);
    vec4 tex = texture2D(uMap, uv) * 0.4;
    tex += texture2D(uMap, uv + vec2(spread, 0.0)) * 0.15;
    tex += texture2D(uMap, uv - vec2(spread, 0.0)) * 0.15;
    tex += texture2D(uMap, uv + vec2(0.0, spread)) * 0.15;
    tex += texture2D(uMap, uv - vec2(0.0, spread)) * 0.15;

    float fade = smoothstep(0.0, 0.92, vUv.y);
    fade *= fade;

    gl_FragColor = vec4(mix(tex.rgb, uTint, uTintAmount), tex.a * fade * uOpacity);
  }
`;

export function createReflectionUniforms(map: Texture): Record<string, IUniform> {
  return {
    uMap: { value: map },
    uOpacity: { value: 0 },
    uTint: { value: new Color("#0e492c") },
    uTintAmount: { value: 0 },
    uBlur: { value: 0.006 },
  };
}

/* ---------------------------------------------------------------------------
 * Glow — the pool of product-coloured light behind the stage.
 *
 * One additive quad with a radial falloff. This is the entire atmosphere: no
 * particles, no volumetrics, nothing competing with the product.
 * ------------------------------------------------------------------------ */

export const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 centred = vUv - 0.5;
    // Vertically stretched, so it reads as light behind a standing object.
    centred.y *= 0.62;
    float falloff = 1.0 - smoothstep(0.0, 0.5, length(centred));
    gl_FragColor = vec4(uColour, pow(falloff, 2.4) * uIntensity);
  }
`;

export function createGlowUniforms(): Record<string, IUniform> {
  return {
    uColour: { value: new Color("#2fd07f") },
    uIntensity: { value: 0.5 },
  };
}

/* ---------------------------------------------------------------------------
 * Motion blur for a photographic pack shot.
 *
 * The pack shot renders on `meshBasicMaterial` rather than a shader of our
 * own, deliberately: three.js then owns the colour management, and a pack
 * shot whose colours shift is a brand problem, not a rendering one. So the
 * blur is patched into three's own `map_fragment` chunk instead of replacing
 * the material.
 *
 * Five taps along the horizontal, which is the axis a product leaves on.
 * Each tap samples the same sRGB texture, so the averaging still happens in
 * linear space and the result is a real blur rather than a lightened smear.
 *
 * The branch costs nothing while nothing is moving: `uBlur` is zero for
 * every product except the ones on their way out of frame.
 * ------------------------------------------------------------------------ */

const BLURRED_MAP_FRAGMENT = /* glsl */ `
  #ifdef USE_MAP
    vec4 sampledDiffuseColor;
    if ( uBlur > 0.00001 ) {
      sampledDiffuseColor  = texture2D( map, vMapUv ) * 0.28;
      sampledDiffuseColor += texture2D( map, vMapUv + vec2( uBlur, 0.0 ) ) * 0.2;
      sampledDiffuseColor += texture2D( map, vMapUv - vec2( uBlur, 0.0 ) ) * 0.2;
      sampledDiffuseColor += texture2D( map, vMapUv + vec2( uBlur * 2.0, 0.0 ) ) * 0.16;
      sampledDiffuseColor += texture2D( map, vMapUv - vec2( uBlur * 2.0, 0.0 ) ) * 0.16;
    } else {
      sampledDiffuseColor = texture2D( map, vMapUv );
    }
    diffuseColor *= sampledDiffuseColor;
  #endif
`;

/**
 * Uniform per material, rather than per component.
 *
 * `onBeforeCompile` runs once, when three first compiles the material, and
 * the uniform object it installs is the one the renderer reads every frame
 * afterwards — so it has to outlive the call. Keeping it here, keyed weakly
 * by the material, means the component never holds a mutable object across
 * renders, which the React compiler does not allow.
 */
const BLUR_UNIFORMS = new WeakMap<Material, IUniform<number>>();

interface CompilableShader {
  uniforms: Record<string, IUniform>;
  fragmentShader: string;
}

/** Call from a material's `onBeforeCompile`. */
export function attachMotionBlur(material: Material, shader: CompilableShader): void {
  const uniform: IUniform<number> = { value: 0 };
  BLUR_UNIFORMS.set(material, uniform);

  shader.uniforms.uBlur = uniform;
  shader.fragmentShader = `uniform float uBlur;
${shader.fragmentShader.replace("#include <map_fragment>", BLURRED_MAP_FRAGMENT)}`;
}

/** Per-frame write. Does nothing until the material has compiled. */
export function setMotionBlur(material: Material | null, value: number): void {
  const uniform = material ? BLUR_UNIFORMS.get(material) : undefined;
  if (uniform) uniform.value = value;
}
