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
    kaleidoAngle: 0,
    rotx : 0,
    roty : 0,
    rotz : 0
};


// TODO : add Dat.GUI
// TODO : add Stats

class LoadSound {
    constructor() {
        this.sound = new Sound(soundFile,125,0,this.startSound.bind(this),false)
    }
    startSound() {
        document.querySelector('.start-btn').addEventListener('click',()=> {
            document.querySelector('.home-container').classList.add('remove')
            document.querySelector('.warning').classList.add('remove')
            setTimeout(()=>{
                document.querySelector('.home-container').style.display = 'none';
                document.querySelector('.warning').style.display = 'none';
                this.sound.play();
            },1000)
    })
    }
}

export default class App {

    constructor() {

        this.cubic = [];
        this.velocity = [];
        this.rayon = .9;

            //Stats
            this.stats = new Stats();
            this.stats.setMode(0); // 0: fps, 1: ms

            this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
            this.camera.rotation.x = params.rotx;
            this.camera.rotation.y = params.roty;
            this.camera.rotation.z = params.rotz;
            
            this.camera.rotation.y = 8;
   

            //Gui
            const gui = new dat.GUI();
            gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
                renderer.toneMappingExposure = Math.pow( value, 4.0 );
            } );
            gui.add( params, 'rotx', 0.1, 20 ).onChange(  ( value )=> {
                this.camera.rotation.x = Number( value );
            } );
            gui.add( params, 'roty', 0.1, 20 ).onChange(  ( value )=> {
                this.camera.rotation.y = Number( value );
            } );
            gui.add( params, 'rotz', 0.1, 20 ).onChange(  ( value )=> {
                this.camera.rotation.z = Number( value );
            } );
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
            

        this.play = new LoadSound();

        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.right = '0px';
        document.body.appendChild( this.stats.domElement );

        //THREE SCENE
        this.container = document.querySelector( '#main' );
    	document.body.appendChild( this.container );



        // this.controls = new OrbitControls(this.camera)

        this.scene = new THREE.Scene();

        //LIGHT
            //Directional
            this.light = new THREE.DirectionalLight({color: 0x0000ff,intensity : 1})
            this.light.position.x = -0.5
            this.light.position.y = 0.8
            this.scene.add(this.light)

            //PointLight
            this.pointLight = new THREE.PointLight( 0x0ae0ff, 0, 2 );
            this.pointLight.position.set( 0, 0, 0 );
            var pointLightHelper = new THREE.PointLightHelper( this.pointLight, 2 );
            this.scene.add( this.pointLight );
            this.scene.add( pointLightHelper );

        //BACK PLANE
        this.pGeometry = new THREE.PlaneBufferGeometry(  window.innerWidth, window.innerHeight, 10 );

        this.uniforms = {
            uTime: { type: 'f', value: 0},
            uAmp: { type:'f', value: 2. },
        };

        let textureLoader = new THREE.TextureLoader();
        let textureNormal = textureLoader.load(snake);

        this.pMaterial = new THREE.MeshBasicMaterial({map: textureNormal})

        this.plane = new THREE.Mesh( this.pGeometry, this.pMaterial );
        
        this.plane.position.x = -3.45; //Z
        this.plane.rotation.y = 1.5;
        this.plane.position.z = 30;
        this.scene.add( this.plane );
      

        // this.planeMaterial = new THREE.MeshPhongMaterial({color:0xfff})
        // this.plane2 = new THREE.Mesh( this.pGeometry, this.planeMaterial );
        // this.plane2.position.x = -3.45;
        // this.plane2.rotation.y = 1.5;
        // this.plane2.position.z = 30;
        // this.scene.add( this.plane2 );

        //RENDERER
    	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    	this.renderer.setPixelRatio( window.devicePixelRatio );
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    	this.container.appendChild( this.renderer.domElement );

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
    //UPDATE
    render(bloomPass) {
        this.stats.begin();
        let time = Date.now()/1000;

        // this.pMaterial.uniforms.uTime.value += time /100000000000;

        composer.render(); //Bloom

        this.stats.end();
    }

    onWindowResize() {
    	this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}
