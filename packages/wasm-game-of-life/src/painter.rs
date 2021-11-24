use crate::universe::Cell;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{console, WebGl2RenderingContext, WebGlProgram, WebGlUniformLocation};

const VERTEX_SHADER: &str = r#"
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
"#;

const FRAGMENT_SHADER: &str = r#"
precision lowp float;

varying vec4 color;

void main() {
  gl_FragColor = color;
}
"#;

pub struct Painter {
    canvas_el: Box<web_sys::HtmlCanvasElement>,
    gl: Box<web_sys::WebGl2RenderingContext>,
    program: Box<web_sys::WebGlProgram>,

    offset: (i32, i32),
    zoom: f32,
}

impl Painter {
    pub fn new(canvas_el: Box<web_sys::HtmlCanvasElement>) -> Painter {
        let gl: web_sys::WebGl2RenderingContext = canvas_el
            .get_context("webgl2")
            .unwrap()
            .unwrap()
            .dyn_into::<web_sys::WebGl2RenderingContext>()
            .unwrap();
        let gl = Box::new(gl);
        let program = Painter::build_shader_program(&gl);

        Painter {
            canvas_el,
            gl,
            program,
            offset: (0, 0),
            zoom: 1.0,
        }
    }

    fn build_shader_program(gl: &Box<web_sys::WebGl2RenderingContext>) -> Box<WebGlProgram> {
        let program = build_program(&gl).expect("Error build program");
        if !gl.get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS) {
            console::log_1(&"Error linking shader program:".into());
            console::log_1(&gl.get_program_info_log(&program).into());
        }
        gl.link_program(&program);

        fn build_program(
            gl: &Box<web_sys::WebGl2RenderingContext>,
        ) -> Option<Box<web_sys::WebGlProgram>> {
            let program = Box::new(gl.create_program()?);

            let shaders = [
                (VERTEX_SHADER, WebGl2RenderingContext::VERTEX_SHADER),
                (FRAGMENT_SHADER, WebGl2RenderingContext::FRAGMENT_SHADER),
            ];
            for (code, t) in shaders {
                let shader = gl.create_shader(t)?;
                gl.shader_source(&shader, code);
                gl.compile_shader(&shader);
                gl.attach_shader(&program, &shader);
            }
            Some(program)
        }

        program
    }

    pub fn paint(&self, cells: &Vec<Cell>, width: u32, height: u32) {
        let Painter {
            canvas_el,
            gl,
            program,
            offset,
            zoom,
        } = self;
        let mut data: Vec<f32> = vec![];
        let row_step = 2.0 / height as f32;
        let col_step = 2.0 / width as f32;
        for row in 0..height {
            for col in 0..width {
                let x1 = col as f32 * col_step - 1.0;
                let x2 = (col as f32 + 1.0) * col_step - 1.0;
                let y1 = row as f32 * row_step - 1.0;
                let y2 = (row as f32 + 1.0) * row_step - 1.0;
                let alive = cells[(row * width + col) as usize] as u32 as f32;
                data.extend([x1, y1, alive].iter());
                data.extend([x2, y1, alive].iter());
                data.extend([x2, y2, alive].iter());
                data.extend([x1, y1, alive].iter());
                data.extend([x1, y2, alive].iter());
                data.extend([x2, y2, alive].iter());
            }
        }

        let vertex_buffer = self.gl.create_buffer();

        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, vertex_buffer.as_ref());

        unsafe {
            let array_buf = js_sys::Float32Array::view(&data);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array_buf,
                WebGl2RenderingContext::STATIC_DRAW,
            )
        }

        let vertex_num_components = 3;
        let vertex_count = data.len() / vertex_num_components;
        let aspect_ratio = (canvas_el.width() as f32) / (canvas_el.height() as f32)
            * (height as f32 / width as f32);

        gl.viewport(0, 0, canvas_el.width() as i32, canvas_el.height() as i32);
        gl.clear_color(0.0, 0.0, 0.0, 1.0);
        gl.clear(WebGl2RenderingContext::COLOR_BUFFER_BIT);

        gl.use_program(Some(program));

        let cell = gl.get_attrib_location(program, "cell") as u32;
        gl.enable_vertex_attrib_array(cell);
        gl.vertex_attrib_pointer_with_i32(
            cell,
            vertex_num_components as i32,
            WebGl2RenderingContext::FLOAT,
            false,
            0,
            0,
        );

        gl.uniform2fv_with_f32_array(
            gl.get_uniform_location(program, "scale").as_ref(),
            [1.0 * zoom / aspect_ratio, 1.0 * zoom].as_ref(),
        );

        gl.uniform2fv_with_f32_array(
            gl.get_uniform_location(program, "offset").as_ref(),
            [
                offset.0 as f32 / canvas_el.width() as f32 * 2.0,
                offset.1 as f32 / canvas_el.height() as f32 * 2.0,
            ]
            .as_ref(),
        );

        gl.draw_arrays(WebGl2RenderingContext::TRIANGLES, 0, vertex_count as i32);
    }

    pub fn dispose(&self) {
        let Painter {
            canvas_el: _,
            gl,
            program,
            offset: _,
            zoom: _,
        } = self;
        gl.delete_program(Some(&program));
    }

    pub fn getOffset(&self) -> (i32, i32) {
        self.offset
    }

    pub fn setOffset(&mut self, x: i32, y: i32) {
        self.offset = (x, y);
    }

    pub fn getZoom(&self) -> f32 {
        self.zoom
    }

    pub fn setZoom(&mut self, zoom: f32) {
        self.zoom = zoom;
    }
}
