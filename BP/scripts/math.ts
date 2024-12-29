/* Math Utility Module */

/*
 *
 * Math Types 
 * 
 */

/**
* A 3D Vector with x, y, and z components.
*/
export class Vec3 {
    /** The x component of the vector. */
    public x: number;

    /** The y component of the vector. */
    public y: number;

    /** The z component of the vector. */
    public z: number;

    /**
     * Creates a new Vec3 instance.
     *
     * @param {number} x The x component of the vector.
     * @param {number} y The y component of the vector.
     * @param {number} z The z component of the vector.
     */
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Mathematical Methods

    /**
     * Adds another Vec3 to this vector.
     * 
     * @param {Vec3} arg1 A Vec3 to add.
     * @returns {Vec3} The updated vector.
     */
    add(arg1?: Vec3): Vec3;
    /**
     * Adds x, y, and z components directly to this vector.
     * 
     * @param {number} arg1 The x component to add.
     * @param {number} arg2 The y component to add.
     * @param {number} arg3 The z component to add.
     * @returns {Vec3} The updated vector.
     */
    add(arg1?: number, arg2?: number, arg3?: number): Vec3;
    add(arg1: Vec3 | number, arg2?: number, arg3?: number): Vec3 {
        if (arg1 instanceof Vec3) {
            // Add another Vec3 to this vector
            this.x += arg1.x;
            this.y += arg1.y;
            this.z += arg1.z;
        } else if (typeof arg1 === "number" && typeof arg2 === "number" && typeof arg3 === "number") {
            // Add x, y, z values to this vector
            this.x += arg1;
            this.y += arg2;
            this.z += arg3;
        } else {
            throw new Error("Invalid arguments passed to Vec3.add");
        }
        return this;
    }

    /**
     * Subtracts another this vector by another Vec3.
     * 
     * @param {Vec3} arg1 A Vec3 to subtract.
     * @returns {Vec3} The updated vector.
     */
    sub(arg1?: Vec3): Vec3;
    /**
     * Subtracts x, y, and z components directly from this vector.
     * 
     * @param {number} arg1 The x component to subtract.
     * @param {number} arg2 The y component to subtract.
     * @param {number} arg3 The z component to subtract.
     * @returns {Vec3} The updated vector.
     */
    sub(arg1?: number, arg2?: number, arg3?: number): Vec3;
    sub(arg1: Vec3 | number, arg2?: number, arg3?: number): Vec3 {
        if (arg1 instanceof Vec3) {
            // Subtract this vector by another Vec3
            this.x -= arg1.x;
            this.y -= arg1.y;
            this.z -= arg1.z;
        } else if (typeof arg1 === "number" && typeof arg2 === "number" && typeof arg3 === "number") {
            // Subtract x, y, z values from this vector
            this.x -= arg1;
            this.y -= arg2;
            this.z -= arg3;
        } else {
            throw new Error("Invalid arguments passed to Vec3.subtract");
        }
        return this;
    }

    /**
     * Scales this vector by a scalar.
     * 
     * @param {number} arg1 The number to scale by.
     * @returns {Vec3} The updated vector.
     */
    scale(arg1?: number): Vec3;
    /**
     * Scales this vector by another Vec3.
     * 
     * @param {Vec3} arg1 A Vec3 to scale by.
     * @returns {Vec3} The updated vector.
     */
    scale(arg1?: Vec3): Vec3;
    /**
     * Scales x, y, and z components directly by this vector.
     * 
     * @param {number} arg1 The x component to scale by.
     * @param {number} arg2 The y component to scale by.
     * @param {number} arg3 The z component to scale by.
     * @returns {Vec3} The updated vector.
     */
    scale(arg1?: number, arg2?: number, arg3?: number): Vec3;
    scale(arg1: Vec3 | number, arg2?: number, arg3?: number): Vec3 {
        if (arg1 instanceof Vec3) {
            // Scale this vector by another Vec3
            this.x *= arg1.x;
            this.y *= arg1.y;
            this.z *= arg1.z;
        } else if (typeof arg1 === "number" && !arg2) {
            // Scale this vector by a scalar
            this.x *= arg1;
            this.y *= arg1;
            this.z *= arg1;
        } else if (typeof arg1 === "number" && typeof arg2 === "number" && typeof arg3 === "number") {
            // Scale this vector by x, y, z values
            this.x *= arg1;
            this.y *= arg2;
            this.z *= arg3;
        } else {
            throw new Error("Invalid arguments passed to Vec3.scale");
        }
        return this;
    }



    // Utility Methods

    /** 
     * Checks if another Vector3 is equivalent to this vector.
     */
    eq(other: Vec3): boolean {
        return (this.x == other.x && this.y == other.y && this.z == other.z);
    }

    /** 
     * Checks if another Vector3 is equivalent to this vector.
     */
    equals(other: Vec3): boolean {
        return (this.x == other.x && this.y == other.y && this.z == other.z);
    }

    /**
     * Returns a formatted string that works with minecraft commands
     */
    toLocStr(): string {
        return `${this.x} ${this.y} ${this.z}`
    }
}

/**
 * Creates a new Vec3 instance.
 *
 * @param {number} x The x value of the vector.
 * @param {number} y The y value of the vector.
 * @param {number} z The z value of the vector.
 * @returns {Vec3} A new Vec3 instance.
 */
export function vec3(x: number, y: number, z: number): Vec3 {
    return new Vec3(x, y, z);
}

/**
 * A bounding box to define a position and area.
 */
export class BBox {

    /** The position (center) of the bounding box */
    public position: Vec3;
    /** The size (dimensions) of the bounding box */
    public size: Vec3;

    /**
     * Creates a new BBox instance.
     * 
     * @param pos The position (x, y, z) of the center of the BBox
     * @param size The dimensions (x, y, z) of the BBox
     */
    constructor(pos: Vec3, size: Vec3) {
        this.position = pos;
        this.size = size;
    }

    /** 
     * Checks if a given point is within the bounding box
     * 
     * @param point The point to check.
     * 
     * @returns true if the point is inside the bounding box, false if it is not.
     */
    pointInBounds(point: Vec3): boolean {
        let hs = this.halfSize();
        let inXBounds = point.x > this.position.x - hs.x && point.x < this.position.x + hs.x;
        let inYBounds = point.y > this.position.y - hs.y && point.y < this.position.y + hs.y;
        let inZBounds = point.z > this.position.z - hs.z && point.z < this.position.z + hs.z;
        return inXBounds && inYBounds && inZBounds;
    }

    /**
     * Gets the half size of the bounding box
     * 
     * @returns The half size of the bounding box.
     */
    halfSize(): Vec3 {
        return new Vec3(this.size.x, this.size.y, this.size.z).scale(0.5);
    }

}

/**
 * Creates a new BBox instance.
 * 
 * @param pos The position (x, y, z) of the center of the BBox
 * @param size The dimensions (x, y, z) of the BBox
 */
export function bbox(pos: Vec3, size: Vec3): BBox {
    return new BBox(pos, size);
}

/*
 *
 * Utility Functions 
 * 
 */

/**
 * Clamps a number between a min and a max.
 * 
 * @param num The number to clamp.
 * @param min The minimum value of num.
 * @param max The maximum value of num.
 * 
 * @returns The num clamped between min and max.
 */
export function clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
}