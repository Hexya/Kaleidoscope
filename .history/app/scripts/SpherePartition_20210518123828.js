import soundFile from '../assets/sound/AESTHETICS PLEASE - Run From Love.mp3';
import Sound from './Sound.js';
import pVertexShader from './shaders/PlaneShader/pVertex.vert';
import pFragmentShader from './shaders/PlaneShader/pFragment.frag';
let OrbitControls = require('three-orbit-controls')(THREE)
let Stats = require('stats-js')

import KaleidoShader from './KaleidoShader';
import RGBShiftShader from './RGBShiftShader';

import 'three/examples/js/postprocessing/EffectComposer';
import 'three/examples/js/postprocessing/RenderPass';
import 'three/examples/js/postprocessing/ShaderPass';
import 'three/examples/js/shaders/CopyShader'

import 'three/examples/js/shaders/DotScreenShader'
import 'three/examples/js/shaders/LuminosityHighPassShader';
import 'three/examples/js/postprocessing/UnrealBloomPass';

import * as dat from 'dat.gui';

// import snake from '../assets/img/uvv.jpeg';
import snake from '../assets/img/snake.jpeg';

var composer,renderer;
var rgbParams, rgbPass;
var kaleidoParams, kaleidoPass;
var params = {
    exposure: 1,
    bloomStrength: 0.7,
    bloomThreshold: 0.9,
    bloomRadius: 0,
    rgbAngle: 3,
    rgbAmount: 0.005,
    kaleidoSides: 0,
    kaleidoAngle: 0
};

export default class App {

    constructor() {

        this.cubic = [];
        this.velocity = [];
        this.rayon = .9;

            //Stats
            this.stats = new Stats();
            this.stats.setMode(0); // 0: fps, 1: ms

            this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
            
            this.camera.rotation.y = 8;
   

            //Gui
            const gui = new dat.GUI();
            // gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
            //     renderer.toneMappingExposure = Math.pow( value, 4.0 );
            // } );
            gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
                bloomPass.threshold = Number( value );
            } );
            gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
                bloomPass.strength = Number( value );
            } );
            gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
                bloomPass.radius = Number( value );
            } );

            gui.add( params, 'rgbAngle', 0.0, 360.0 ).step( 0.01 ).onChange( function ( value ) {
                rgbPass.uniforms[ "angle" ].value = Number( value ) * 3.1416;
            } );
            gui.add( params, 'rgbAmount', 0.0, 360.0 ).step( 0.01 ).onChange( function ( value ) {
                rgbPass.uniforms[ "amount" ].value = Number( value );
            } );
            gui.add( params, 'kaleidoSides', 0.0, 12.0 ).step( 0.01 ).onChange( function ( value ) {
                kaleidoPass.uniforms[ "sides" ].value = Number( value );
            } );
            gui.add( params, 'kaleidoAngle', 0.0, 360.0 ).step( 0.01 ).onChange( function ( value ) {
                kaleidoPass.uniforms[ "angle" ].value = Number( value ) * 3.1416;
            } );
            
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.left = '0px';
        document.body.appendChild( this.stats.domElement );

        //THREE SCENE
        this.container = document.querySelector( '#main' );
    	document.body.appendChild( this.container );

        // this.controls = new OrbitControls(this.camera)

        this.scene = new THREE.Scene();

        //LIGHT
        this.light = new THREE.AmbientLight({color: 0x0000ff,intensity : 1})
        this.light.position.x = -0.5
        this.light.position.y = 0.8
        this.scene.add(this.light)

        //PLANE
        this.pGeometry = new THREE.PlaneBufferGeometry(  10, 10, 10 );
        let textureLoader = new THREE.TextureLoader();
        var texture = textureLoader.load(snake);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        this.pMaterial = new THREE.MeshBasicMaterial({map: texture})
        this.plane = new THREE.Mesh( this.pGeometry, this.pMaterial );
        
        this.scene.add( this.plane );
        this.camera.position.z = 10
        this.camera.lookAt(this.plane.position)
        
        //RESCALE PLANE
        let currentBox3 = new THREE.Box3().setFromObject(this.plane)
        console.log(this.camera)
        const width = Math.abs(currentBox3.min.x - currentBox3.max.x)
        const height = Math.abs(currentBox3.min.y - currentBox3.max.y)
        const size = this.getPerspectiveSize(this.camera, this.camera.position.z);
        let reScale = (size.width / (Math.abs(currentBox3.max.x) + Math.abs(currentBox3.min.x)))*1.3;
        this.plane.scale.set(reScale, reScale, reScale)

        //RENDERER
    	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    	this.renderer.setPixelRatio( window.devicePixelRatio );
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    	this.container.appendChild( this.renderer.domElement );

        document.querySelector('#main').addEventListener( 'mousemove', this.onMouseMove.bind(this), false );
    	window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize();

        //BLOOM
        var renderScene = new THREE.RenderPass( this.scene, this.camera );
        var rgbPass = new THREE.ShaderPass( THREE.RGBShiftShader );
        var kaleidoPass = new THREE.ShaderPass( THREE.KaleidoShader );
        var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        //bloomPass.renderToScreen = true;
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;

        rgbPass.uniforms[ "angle" ].value = params.rgbAngle * 3.1416;
        rgbPass.uniforms[ "amount" ].value = params.rgbAmount;
        kaleidoPass.uniforms[ "sides" ].value = params.kaleidoSides;
        kaleidoPass.uniforms[ "angle" ].value = params.kaleidoAngle * 3.1416;

        composer = new THREE.EffectComposer( this.renderer );
        composer.setSize( window.innerWidth, window.innerHeight );
        composer.addPass( renderScene );
        composer.addPass( bloomPass );

        composer.addPass( kaleidoPass );
        composer.addPass( rgbPass );

        //Add to fixe
        var copyPass = new THREE.ShaderPass(THREE.CopyShader);
        copyPass.renderToScreen = true;
        composer.addPass(copyPass)

        this.renderer.animate( this.render.bind(this, bloomPass));

    }

    onMouseMove( event ) {
        this.mouseX = ( event.clientX / window.innerWidth ) * 20 - 1;
        this.mouseY = - ( event.clientY / window.innerHeight ) * 20 + 1;
        console.log(this.mouseX)
    }

    //UPDATE
    render(bloomPass) {
        this.stats.begin();
        let time = Date.now()/1000;

        // this.pMaterial.uniforms.uTime.value += time /100000000000;

        this.plane.rotation.z += 0.01

        composer.render(); //Bloom

        this.stats.end();
    }

    getPerspectiveSize(camera, distance) {

        const vFOV = camera.fov * Math.PI / 180;
        const height = 2 * Math.tan( vFOV / 2 ) * Math.abs(distance);
        const aspect = camera.aspect;
        const width = height * aspect;
    
        return { width, height };
    }

    onWindowResize() {
    	this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}
