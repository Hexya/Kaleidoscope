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
    kaleidoSides: 7,
    kaleidoAngle: 0
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

            //Gui
            const gui = new dat.GUI();
            gui.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
                renderer.toneMappingExposure = Math.pow( value, 4.0 );
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

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );

        this.camera.position.x = 0.3;
        this.camera.position.y = 0.3;
        this.camera.position.z = Math.pow(1.7, -17);

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

            //PointSphere
            let geometrys = new THREE.SphereGeometry( 0.05, 20, 20 );
            let materials = new THREE.MeshBasicMaterial({color:0xffffff});
            this.sphereLight = new THREE.Mesh( geometrys, materials );

        //BACK PLANE
        this.pGeometry = new THREE.PlaneBufferGeometry(  window.innerWidth, window.innerHeight, 10 );

        this.uniforms = {
            uTime: { type: 'f', value: 0},
            uAmp: { type:'f', value: 2. },
        };

        this.pMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: this.uniforms,
            vertexShader: pVertexShader,
            fragmentShader: pFragmentShader,
        });

        this.plane = new THREE.Mesh( this.pGeometry, this.pMaterial );
        this.plane.position.x = -3.45; //Z
        this.plane.rotation.y = 1.5;
        this.plane.position.z = 30;
        this.scene.add( this.plane );


        //TORUS
        let geoTorus = new THREE.TorusGeometry( 0.09, 0.002, 30,80 );
        let matTorus = new THREE.MeshStandardMaterial({color:0xcdab0d,metalness:1});
        this.torus = new THREE.Mesh( geoTorus, matTorus );
        this.scene.add(this.torus)

        let geoTorusM = new THREE.TorusGeometry( 0.095, 0.003, 30,80 );
        let matTorusM = new THREE.MeshStandardMaterial({color:0xffffff,metalness:1});
        this.torusM = new THREE.Mesh( geoTorusM, matTorusM );
        this.scene.add(this.torusM)

        let geoTorusS = new THREE.TorusGeometry( 0.1, 0.004, 30,80 );
        let matTorusS = new THREE.MeshStandardMaterial({color:0xcd720d,metalness:1});
        this.torusS = new THREE.Mesh( geoTorusS, matTorusS );
        this.scene.add(this.torusS)

        this.group = new THREE.Group();

        // SPHERE GENERATION
    	//for(var i=0; i<600; i++) {
    	for(var x=0; x<25; x++) {
    	    for(var y=0; y<25; y++) {
                let geometry = new THREE.SphereBufferGeometry( 0.02, 20, 20 );
                let material = new THREE.MeshPhongMaterial();
                this.mesh = new THREE.Mesh( geometry, material );

                this.mesh.position.x = this.rayon * Math.cos(y) * Math.sin(x);
                this.mesh.position.y = this.rayon * Math.sin(y) * Math.sin(x);
                this.mesh.position.z = this.rayon * Math.cos(x);

                let velo = THREE.Math.randFloat(-.2, .2);
                this.velocity.push(velo)
                let scale = THREE.Math.randFloat(.3, 1)
                this.mesh.scale.set(scale, scale, scale)
                this.cubic.push(this.mesh);
                this.scene.add(this.mesh);

                this.group.add(this.mesh);
                this.scene.add(this.group);
            }
        }

        //BEGIN STATUS
        this.group.scale.set(.3,.3,.3);
        this.sphereLight.scale.set(.0,.0,.0);
        this.group.position.y = -1;

        //console.log(this.group)
        //console.log(this.scene)
        //console.log(this.cubic)
        //console.log(this.sphereLight)

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

        this.pMaterial.uniforms.uTime.value += time /100000000000;

        //STROKE GROUP ANIM
        for(var i=0; i<250; i++) {

            if(this.play.sound.frequencyDataArray[90] > 120 && this.group.children[i].scale.x < 100) {
                this.group.children[i].scale.x += 0.1
                this.group.children[i].position.x += Math.cos(time) * this.velocity[i] / 100; /// SLIDE X
                this.group.children[i].position.y += Math.cos(time) * this.velocity[i + 10] / 100; /// SLIDE X
                this.group.children[i].position.z += Math.cos(time) * this.velocity[i + 5] / 100; /// SLIDE X
            } else {
                this.group.children[i].position.z += Math.cos(time) * this.velocity[i + 5] / 100; /// SLIDE X
            }
        }

        //SPHERE GROUP
        for(var i=275; i<625; i++) {

            if(this.play.sound.frequencyDataArray[90] > 120 && this.group.children[i].scale.x < 100) {

                this.group.children[i].position.x += Math.cos(time) * this.velocity[i] / 100; /// SLIDE X
                this.group.children[i].position.y += Math.cos(time) * this.velocity[i + 10] / 100; /// SLIDE X
                this.group.children[i].position.z += Math.cos(time) * this.velocity[i + 5] / 100; /// SLIDE X
            } else {
                //this.group.children[i].position.y = (Math.sin(time)+this.play.sound.frequencyDataArray[90])/200;
            }
        }

        //GLOBAL ANIMATION
        for(var i=0;i<1;i++) {

            //ROTATE GROUP TORUS
            this.group.rotation.x += 0.003;
            this.group.rotation.y += 0.005;
            this.group.rotation.z += 0.001;

            this.torus.rotation.x += 0.01;
            this.torus.rotation.y += 0.03;
            this.torus.rotation.z += 0.02;

            this.torusS.rotation.x += 0.03;
            this.torusS.rotation.y += 0.02;
            this.torusS.rotation.z += 0.01;

            this.torusM.rotation.x += 0.02;
            this.torusM.rotation.y -= 0.02;
            this.torusM.rotation.z += 0.03;

            //SCALE GROUP
            if(this.group.scale.x < 1 && this.group.scale.y < 1 && this.group.scale.z < 1) {
                this.group.scale.x += 0.01
                this.group.scale.y += 0.01
                this.group.scale.z += 0.01
            } else {
                this.group.scale.x = 1
                this.group.scale.y = 1
                this.group.scale.z = 1
            }
            //SOUND Effect Color & Rotate
            if(this.play.sound.frequencyDataArray[90] > 120 ) {
                //console.log(this.play.sound.frequencyDataArray[90])
                this.group.rotation.x += 0.04
                this.group.rotation.y += 0.06
                this.group.rotation.z += 0.02

                this.pointLight.color.r = 0;
                this.pointLight.color.g = 0.5;
                this.pointLight.color.b = 1;

                this.sphereLight.material.color.r = 1;
                this.sphereLight.material.color.g = 1;
                this.sphereLight.material.color.b = 1;

                this.torus.rotation.x += 0.02;
                this.torus.rotation.y += 0.09;
                this.torus.rotation.z += 0.05;

                this.torusS.rotation.x += 0.05;
                this.torusS.rotation.y += 0.03;
                this.torusS.rotation.z += 0.01;

                this.torusM.rotation.x += 0.04;
                this.torusM.rotation.y -= 0.02;
                this.torusM.rotation.z += 0.02;

                if(this.play.sound.frequencyDataArray[140]>150) {
                    this.pointLight.color.r = 1;
                    this.pointLight.color.g = 0;
                    this.pointLight.color.b = 1;

                    this.sphereLight.material.color.r = 1;
                    this.sphereLight.material.color.g = 0;
                    this.sphereLight.material.color.b = 1;
                }
            } else if(this.pointLight.intensity <= 2) {
                this.pointLight.color.r = 0;
                this.pointLight.color.g = 1;
                this.pointLight.color.b = 1;

                this.sphereLight.material.color.r = 1;
                this.sphereLight.material.color.g = 1;
                this.sphereLight.material.color.b = 1;
            }
            //BEGIN ANIMATION
            if(this.group.position.y < 0) {
                this.group.position.y = 0
            } else {
                this.scene.add(this.sphereLight)
                //LIGHT
                if(this.pointLight.intensity < 2) {
                    this.pointLight.intensity += 0.01;

                    this.sphereLight.scale.x += 0.0025
                    this.sphereLight.scale.y += 0.0025
                    this.sphereLight.scale.z += 0.0025

                //AFTER READY SOUND
                } else {
                    document.querySelector('.start-btn').style.opacity = "1";
                    document.querySelector('.load-btn').style.display = "none";
                    document.querySelector('.start-btn').classList.add('bounce-anim');
                    document.querySelector('.ready-anim').classList.add('play-ready');

                    this.pointLight.intensity = 2;

                    this.sphereLight.scale.x = 0.5 + (this.play.sound.frequencyDataArray[90]/200)
                    this.sphereLight.scale.y = 0.5 + (this.play.sound.frequencyDataArray[90]/200)
                    this.sphereLight.scale.z = 0.5 + (this.play.sound.frequencyDataArray[90]/200)

                    //BLOOM TIME EFFECT
                    switch (true) {
                        case this.play.sound.time > 46 && this.play.sound.time < 77:
                            console.log('medium')
                            bloomPass.threshold = 0.17;
                            break;
                        case this.play.sound.time > 77 && this.play.sound.time < 92:
                            console.log('slow')
                            bloomPass.threshold = 0.9;
                            break;
                        case this.play.sound.time > 92 && this.play.sound.time < 107:
                            console.log('hard')
                            bloomPass.threshold = 0.17;
                            bloomPass.strength = 1.7;
                            break;
                        case this.play.sound.time > 107 && this.play.sound.time < 123:
                            console.log('slow')
                            bloomPass.threshold = 0.9;
                            bloomPass.strength = 0.7;
                            break;
                        case this.play.sound.time > 123 && this.play.sound.time < 153:
                            console.log('medium')
                            bloomPass.threshold = 0.17;
                            bloomPass.strength = 0.7;
                            break;
                        case this.play.sound.time > 153 && this.play.sound.time < 184:
                            console.log('hard')
                            bloomPass.threshold = 0.17;
                            bloomPass.strength = 1.7;
                            break;
                        case this.play.sound.time > 184 && this.play.sound.time < 205:
                            console.log('medium')
                            bloomPass.threshold = 0.17;
                            bloomPass.strength = 0.7;
                            break;
                        case this.play.sound.time > 205:
                            console.log('slow')
                            bloomPass.threshold = 0.9;
                            bloomPass.strength = 0.7;
                            break;
                        default:
                    }
                }
                this.group.position.y = 0
            }
        }

        //RENDER
    	//this.renderer.render( this.scene, this.camera ); //Default
        composer.render(); //Bloom

        this.stats.end();
    }

    onWindowResize() {
    	this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}
