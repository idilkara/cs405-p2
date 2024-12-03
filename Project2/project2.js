/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		
		//for task 2 I initialize the normal buffer and lightPos, enableLighting I get set via the functions to be used within the shaders.
		//initialize normal buffers
		this.normalBuffer=gl.createBuffer();
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

		//lightPosition (gets updated with arrow movements) , ambient (setambientlight), enableLight 
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');

		//for task3, similar to the ambient lighting, the intensity of specular light is set. 
		this.specularLoc = gl.getUniformLocation(this.prog, 'specular');

		//for task4, I use a blending factor set via a slider in the html which calls the function here, setblendingfactor() 
		this.blendFactorLoc =  gl.getUniformLocation(this.prog, 'blendFactor');
		// this.sampler = gl.getUniformLocation(this.prog, 'tex'); //already got this from loading the first texture
		// this.sampler2 = gl.getUniformLocation(this.prog, 'tex2'); ///already got this from loading the second texture

		//ensuring the use of this.prog :
		gl.useProgram(this.prog);

	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		//for task2, same what as above but for the normal coordinates. "update normal coords"
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */

		// for task2: 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

		//for task 2 (and 3) store the light position in ligth position location.
		//it is going to be the negative of the light direction in z axis. 
		// I also set it like the illumination is coming from the camera's view so z =1.0, and for light direction calculation it will turn around to  direct at -z. 
		//(note that it is not parallel to z axis due to the variance in x and y coordinates) 
		gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0); 

		//for task 4 - I active and bind the texture here too for blending ( to ensure it works properly. )
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture); 
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.texture2); 


		///////////////////////////////


		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {

			//console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			/**
			 * @Task1 : You should implement this part to accept non power of 2 sized textures
			 */

			//for task 1: I wrap horizontally and vertically and set minimizing and maximizing options for the texture.
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		}

		gl.useProgram(this.prog);

		//for task 4 I use the texture in draw(trans) to activate and bind again : 
		this.texture = texture;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	//for task4: setSecondTexture - similar to how setTexture works. 
	//in the html file there is a  LoadTexture2( param ) function which calls this. 
	setSecondTexture(img) {
		const texture2 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture2);
	
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img
		);
	
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);

		//I use the texture2 in draw(trans) to activate and bind again : 
		//also I set the blendfactor to 0.5 when there is the second texture so the belnding effect is immediately visible.
		this.texture2 = texture2;
		this.setBlendFactor(0.5); 

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture2);
		const sampler2 = gl.getUniformLocation(this.prog, 'tex2');
		gl.uniform1i(sampler2, 1);
	}

	//for task 4: this is a parameter to toggle between textures.
	// if it is 0.0 it means only the first image will be fully visible.
	// if it is 1.0 it means only the second image will be fully visible.
	// in between means the result will be a blended version of the two textures.
	// this is called from the html file with a function thats used via a slider. 
	setBlendFactor(factor) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.blendFactorLoc, factor);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		//console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */

		//for task2, after ensuring this.prog is used, depending on the value of show, I set the value in enablelighting location to 1 or 0. 
		//if the value is 1, it means the lighting is enabled, I set ambient and specular lights to be visible (this can be modified with the sliders later.)
		gl.useProgram(this.prog);

		if (show){
			gl.uniform1i(this.enableLightingLoc, 1);
				
				//this is to set a default value
				this.setAmbientLight(0.50); 
				this.setSpecularLight(50.0); 
		}
		else{
			gl.uniform1i(this.enableLightingLoc, 0);
		}

	}
	
	setAmbientLight(ambient) {
		//console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */

		//for task2, after ensuring this.prog is used,  
		// I store "ambient" value got from the slider, in the ambient location
		gl.useProgram(this.prog);
		gl.uniform1f(this.ambientLoc, ambient);

	}

	//for task3 I need to get and set the value for the intensity of specular light so I wrote the function similar to setAmbientLight function.
	setSpecularLight(specular) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.specularLoc, specular);
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				//v_normal = normal; //this was the previous version, this works but when the object rotates, the light source seems to rotate with it too. 
													//so always the same part of the object is lit unless I move the light source.

				//for task 2 and 3: this version to est v_normal, updates the normals as the object moves. 
				// This is to keep the light reflections coming from a nonmoving source.
				// Otherwise, the light source seems to rotate with the object
				v_normal = mat3(mvp)*normal; 

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex;
			uniform vec3 color; 
			uniform vec3 lightPos;
			uniform float ambient;

			varying vec2 v_texCoord;
			varying vec3 v_normal;

			uniform float specular; //for task3
			uniform float blendFactor; //for task4 // it is a value between 0 and 1
			uniform sampler2D tex2; //for task4

			void main()
			{
				if(showTex && enableLighting){
					// UPDATE THIS PART TO HANDLE LIGHTING
					//gl_FragColor = texture2D(tex, v_texCoord); //given version
					
					//the line below would be sufficient to see for task 1-2-3 but for task 4 I mix two textures and set it as the blended texture.
					//vec4 blendedTexture = texture2D(tex, v_texCoord); 

					//blend two textures for task 4:
					//for the vertex colors set by the textures tex and tex2:
					vec4 texColor1 = texture2D(tex, v_texCoord);
					vec4 texColor2 = texture2D(tex2, v_texCoord);
					vec4 blendedTexture = mix(texColor1, texColor2, blendFactor);

					vec3 lightColor = vec3(1.0,1.0,1.0); //not required since using colorFromTex would be sufficient for the multiplicaitons. but in the lab codes a light color was used, so I am using.  
					
					vec3 normal = normalize(v_normal); // normalize it otherwise the light intensity is too much
					vec3 lightDir = normalize(-lightPos); //negative of the light pos 
					vec3 viewDir = normalize(vec3(0.0, 0.0, -1.0)); //I hardcoded it since the camera is fixed for this project. looks at -z.
					
					//for task 2:
					vec3 ambientLight = ambient * lightColor ;
					float light = max(dot(normal, lightDir), 0.0); //intensity 
					vec3 diffuseLight = light * lightColor ;

					//for task3: 
					vec3 reflectDir = reflect(-lightDir,  normal); //calcualte the reflection vector
					float spec = 0.0;
					if (light > 0.0) { //this conditon is to ensure that the front is lit and not the behind of the object but "max(dot(viewDir, reflectDir), 0.0)" can be handling this, I use the if statement to make sure.
						spec = pow(max(dot(viewDir, reflectDir), 0.0), specular); //specular intensity on the point based on the specular factor .
					}
					vec3 specularLight = spec *  lightColor ; 
					
					//vec3 finalLighting = (ambientLight + diffuseLight ) * blendedTexture.rgb; //for task2 using this as the final lighting would be enough. 

					// final lighting and texture together for task 2, 3 and 4 altogether.
					vec3 finalLighting = (ambientLight + diffuseLight + specularLight) * blendedTexture.rgb; 
					gl_FragColor = vec4(finalLighting, blendedTexture.a) ; 

				}
				else if(showTex){
					//gl_FragColor = texture2D(tex, v_texCoord); //default version, works for tasks 1, 2 and 3. 

					//for task4: sets a mixture of two textures as the fragColor instead of one texture.
					vec4 texColor1 = texture2D(tex, v_texCoord);
					vec4 texColor2 = texture2D(tex2, v_texCoord);
					vec4 blendedTexture = mix(texColor1, texColor2, blendFactor);
					gl_FragColor = blendedTexture;
				}
				else{
					gl_FragColor =  vec4(1.0, 0, 0, 1.0);
				}
			}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////