let vehicles = [];
let sliders = {};
let labels = {};

function setup() {
    createCanvas(windowWidth, windowHeight);

    // Initialize UI links
    sliders.dist = select('#dist-slider');
    sliders.radius = select('#radius-slider');
    sliders.theta = select('#theta-slider');
    sliders.speed = select('#speed-slider');
    sliders.force = select('#force-slider');

    labels.dist = select('#dist-label');
    labels.radius = select('#radius-label');
    labels.theta = select('#theta-label');
    labels.speed = select('#speed-label');
    labels.force = select('#force-label');

    // UI Buttons and Checks
    select('#perlin-check').changed(() => {
        // Option handled in wander call
    });

    select('#debug-check').changed(() => {
        Vehicle.debug = select('#debug-check').checked();
    });

    select('#add-btn').mousePressed(() => {
        addVehicle();
    });

    select('#clear-btn').mousePressed(() => {
        vehicles = [];
    });

    // Initial 20 vehicles
    for (let i = 0; i < 20; i++) {
        addVehicle();
    }
}

function addVehicle() {
    let x = random(width);
    let y = random(height);
    let col = [random(100, 255), random(100, 255), random(100, 255)];
    let v = new Vehicle(x, y, col);
    // Add variations
    v.r = random(4, 10);
    v.maxHistory = random(15, 40);
    vehicles.push(v);
}

function draw() {
    background(26);

    // Update labels from sliders
    labels.dist.html(`Wander Distance: ${sliders.dist.value()}`);
    labels.radius.html(`Wander Radius: ${sliders.radius.value()}`);
    labels.theta.html(`Theta Change: ${sliders.theta.value()}`);
    labels.speed.html(`Max Speed: ${sliders.speed.value()}`);
    labels.force.html(`Max Force: ${sliders.force.value()}`);

    let d = float(sliders.dist.value());
    let r = float(sliders.radius.value());
    let t = float(sliders.theta.value());
    let s = float(sliders.speed.value());
    let f = float(sliders.force.value());
    let usePerlin = select('#perlin-check').checked();

    for (let v of vehicles) {
        let wanderForce = v.wander(d, r, t, usePerlin);
        v.applyForce(wanderForce);
        v.update(s, f);
        v.edges();
        v.show();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
