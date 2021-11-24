import type { Cell } from './universe';

const vertexShader = `
attribute vec3 cell;

uniform vec2 scale;
uniform vec2 offset;

varying vec4 color;

void main() {
  if (cell[2] > 0.0) {
    color = vec4(1.0, 1.0, 1.0, 1.0);
  } else {
    color = vec4(0.0, 0.0, 0.0, 1.0);
  }
  gl_Position = vec4(
    cell.x * scale.x + offset.x,
    cell.y * scale.y + offset.y,
    0.0,
    1.0
  );
}
`;

const fragmentShader = `
precision lowp float;

varying vec4 color;

void main() {
  gl_FragColor = color;
}
`;

export class Painter {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null;
  private vertexBuffer?: WebGLBuffer | null;

  private offset: [number, number];
  private zoom: number;

  static new(canvasEl: HTMLCanvasElement): Painter {
    return new Painter(canvasEl);
  }

  private constructor(private canvasEl: HTMLCanvasElement) {
    this.gl = canvasEl.getContext('webgl2')!;
    this.offset = [0, 0];
    this.zoom = 1;
    if (!this.gl) {
      throw new Error('Failed to initialize webgl context');
    }
    this.program = this.buildShaderProgram();
  }

  private buildShaderProgram() {
    const { gl } = this;
    const program = buildProgram();
    program && gl.linkProgram(program);

    if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log('Error linking shader program:');
      program && console.log(gl.getProgramInfoLog(program));
    }
    function buildProgram() {
      const program = gl.createProgram();
      if (!program) {
        return null;
      }

      const shaders = [
        { code: vertexShader, type: gl.VERTEX_SHADER },
        { code: fragmentShader, type: gl.FRAGMENT_SHADER },
      ];
      shaders.forEach(({ code, type }) => {
        const shader = gl.createShader(type);
        if (shader) {
          gl.shaderSource(shader, code);
          gl.compileShader(shader);
        }
        if (!shader || !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.log(
            `Error compiling ${
              type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
            } shader:`
          );
          shader && console.log(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(program, shader!);
      });
      return program;
    }

    return program;
  }

  public paint(cells: Cell[], width: number, height: number) {
    const { gl, canvasEl, zoom } = this;
    const data: number[] = [];
    const rowStep = 2 / height;
    const colStep = 2 / width;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const alive = cells[row * width + col];
        const x1 = col * colStep - 1;
        const x2 = (col + 1) * colStep - 1;
        const y1 = row * rowStep - 1;
        const y2 = (row + 1) * rowStep - 1;
        data.push(x1, y1, alive);
        data.push(x2, y1, alive);
        data.push(x2, y2, alive);
        data.push(x1, y1, alive);
        data.push(x1, y2, alive);
        data.push(x2, y2, alive);
      }
    }

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    const vertexNumComponents = 3;
    const vertexCount = data.length / vertexNumComponents;
    const aspectRatio = (canvasEl.width / canvasEl.height) * (height / width);

    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    const cell = gl.getAttribLocation(this.program!, 'cell');
    gl.enableVertexAttribArray(cell);
    gl.vertexAttribPointer(cell, vertexNumComponents, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(gl.getUniformLocation(this.program!, 'scale'), [
      (1 / aspectRatio) * zoom,
      1 * zoom,
    ]);

    gl.uniform2fv(gl.getUniformLocation(this.program!, 'offset'), [
      (this.offset[0] / canvasEl.width) * 2,
      (this.offset[1] / canvasEl.height) * 2,
    ]);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }

  dispose() {
    this.program && this.gl.deleteProgram(this.program);
    this.vertexBuffer && this.gl.deleteBuffer(this.vertexBuffer);
  }

  setOffset(x: number, y: number) {
    this.offset = [x, y];
  }

  getOffset() {
    return this.offset;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }

  getZoom() {
    return this.zoom;
  }
}
