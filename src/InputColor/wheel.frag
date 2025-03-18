precision mediump float;

varying vec2 uv;

uniform vec4 hsva;

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {

	vec2 pos = uv * 2.0 - 1.0;

	float hue = atan(pos.x, pos.y) / (2.0 * 3.14159265358979323846);
	float sat = 1.0;
	float val = 1.0;

	vec3 rgb = hsv2rgb(vec3(hue, sat, val));

	gl_FragColor = vec4(rgb, 1.0);
}