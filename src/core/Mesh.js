import {
	mat4,
} from 'gl-matrix';
import * as GL from '../core/GL';
import Capabilities from 'core/Capabilities';
import Object3D from 'core/Object3D';
import { ERROR_EXTENSION_ANGLE_INSTANCE_ARRAYS } from 'core/Messages';
import { warn } from 'utils/Console';

let gl;

export default class Mesh extends Object3D {
	constructor(geometry, shader) {
		super();
		this.geometry = geometry;
		this.shader = shader;
		this.shader.create(this.geometry);
		this.modelMatrix = mat4.create();
		this.visible = true;
		this.instanceCount = 0;
	}

	setInstanceCount(value) {
		gl = GL.get();
		if (!Capabilities(gl).extensions.angleInstanceArraysSupported) {
			warn(ERROR_EXTENSION_ANGLE_INSTANCE_ARRAYS);
		}
		this.isInstanced = true;
		this.instanceCount = value;
	}

	draw(modelViewMatrix, projectionMatrix, camera) {
		if (!this.visible) return;

		gl = GL.get();

		this.shader.bindProgram();

		if (this.geometry.vertices) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.vertex.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aVertexPosition,
				this.geometry.attributes.vertex.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (this.geometry.uvs) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.uv.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aUv,
				this.geometry.attributes.uv.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (this.geometry.normals) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.normal.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aVertexNormal,
				this.geometry.attributes.normal.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (this.geometry.colors) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.color.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aVertexColor,
				this.geometry.attributes.color.itemSize, gl.FLOAT, false, 0, 0);
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometry.attributes.index.buffer);

		// Update modelMatrix
		this.updateMatrix();

		this.shader.setUniforms(modelViewMatrix, projectionMatrix, this.modelMatrix, camera);

		// Culling enable
		if (this.shader.culling !== false) {
			gl.enable(gl.CULL_FACE);
			gl.cullFace(this.shader.culling);
		}

		gl.drawElements(this.shader.drawType,
			this.geometry.attributes.index.numItems, gl.UNSIGNED_SHORT, 0);

		// Culling disable
		if (this.shader.culling !== false) {
			gl.disable(gl.CULL_FACE);
		}
	}

	drawInstance(modelViewMatrix, projectionMatrix, camera) {
		if (!this.visible) return;

		gl = GL.get();

		this.shader.bindProgram();

		const ext = Capabilities(gl).extensions.angleInstanceArrays;

		if (this.geometry.vertices) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.vertex.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aVertexPosition,
				this.geometry.attributes.vertex.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (this.geometry.uvs) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.uv.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aUv,
				this.geometry.attributes.uv.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (this.geometry.normals) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.normal.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aVertexNormal,
				this.geometry.attributes.normal.itemSize, gl.FLOAT, false, 0, 0);
		}

		if (this.geometry.colors) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributes.color.buffer);
			gl.vertexAttribPointer(this.shader.attributeLocations.aVertexColor,
				this.geometry.attributes.color.itemSize, gl.FLOAT, false, 0, 0);
		}

		// Additional Instance buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.attributesInstanced.offset.buffer);
		gl.vertexAttribPointer(this.shader.attributeLocations.aOffset,
				this.geometry.attributesInstanced.offset.itemSize, gl.FLOAT, false, 0, 0);
		ext.vertexAttribDivisorANGLE(this.shader.attributeLocations.aOffset, 1);

		// Update modelMatrix
		this.updateMatrix();

		this.shader.setUniforms(modelViewMatrix, projectionMatrix, this.modelMatrix, camera);

		// Culling enable
		if (this.shader.culling !== false) {
			gl.enable(gl.CULL_FACE);
			gl.cullFace(this.shader.culling);
		}

		ext.drawElementsInstancedANGLE(gl.TRIANGLES,
			this.geometry.attributes.index.numItems, gl.UNSIGNED_SHORT, 0, this.instanceCount);

		// Reset
		ext.vertexAttribDivisorANGLE(this.shader.attributeLocations.aOffset, 0);

		// Culling disable
		if (this.shader.culling !== false) {
			gl.disable(gl.CULL_FACE);
		}
	}
}
