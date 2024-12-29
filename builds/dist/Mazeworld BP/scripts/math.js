/* Math Utility Module */ /*
 *
 * Math Types 
 * 
 */ /**
* A 3D Vector with x, y, and z components.
*/ export class Vec3 {
    add(arg1, arg2, arg3) {
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
    sub(arg1, arg2, arg3) {
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
    scale(arg1, arg2, arg3) {
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
     */ eq(other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    }
    /** 
     * Checks if another Vector3 is equivalent to this vector.
     */ equals(other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    }
    /**
     * Returns a formatted string that works with minecraft commands
     */ toLocStr() {
        return `${this.x} ${this.y} ${this.z}`;
    }
    /**
     * Creates a new Vec3 instance.
     *
     * @param {number} x The x component of the vector.
     * @param {number} y The y component of the vector.
     * @param {number} z The z component of the vector.
     */ constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
/**
 * Creates a new Vec3 instance.
 *
 * @param {number} x The x value of the vector.
 * @param {number} y The y value of the vector.
 * @param {number} z The z value of the vector.
 * @returns {Vec3} A new Vec3 instance.
 */ export function vec3(x, y, z) {
    return new Vec3(x, y, z);
}
/**
 * A bounding box to define a position and area.
 */ export class BBox {
    /** 
     * Checks if a given point is within the bounding box
     * 
     * @param point The point to check.
     * 
     * @returns true if the point is inside the bounding box, false if it is not.
     */ pointInBounds(point) {
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
     */ halfSize() {
        return new Vec3(this.size.x, this.size.y, this.size.z).scale(0.5);
    }
    /**
     * Creates a new BBox instance.
     * 
     * @param pos The position (x, y, z) of the center of the BBox
     * @param size The dimensions (x, y, z) of the BBox
     */ constructor(pos, size){
        this.position = pos;
        this.size = size;
    }
}
/**
 * Creates a new BBox instance.
 * 
 * @param pos The position (x, y, z) of the center of the BBox
 * @param size The dimensions (x, y, z) of the BBox
 */ export function bbox(pos, size) {
    return new BBox(pos, size);
}
/*
 *
 * Utility Functions 
 * 
 */ /**
 * Clamps a number between a min and a max.
 * 
 * @param num The number to clamp.
 * @param min The minimum value of num.
 * @param max The maximum value of num.
 * 
 * @returns The num clamped between min and max.
 */ export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}
