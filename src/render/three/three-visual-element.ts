import { visualElement } from ".."
import { ResolvedValues, VisualElementConfig } from "../types"
import * as Three from "three"
import { axisBox } from "../../utils/geometry"
import { checkTargetForNewValues, getOrigin } from "../utils/setters"
import { getChildIndex } from "./utils/get-child-index"

export interface ThreeRenderState {
    position?: [number, number, number]
    rotation?: [number, number, number]
    scale?: [number, number, number]
    latest: ResolvedValues
}

export interface ThreeVisualElementOptions {}

const config: VisualElementConfig<
    Three.Object3D,
    ThreeRenderState,
    ThreeVisualElementOptions
> = {
    treeType: "three",

    /**
     *
     */
    readValueFromInstance(threeObject, key) {
        return 0
    },

    // TODO
    createRenderState: () => ({
        latest: {},
    }),

    sortNodePosition(a, b) {
        return getChildIndex(a) > getChildIndex(b) ? 1 : -1
    },

    // TODO
    getBaseTarget(props, key) {
        return 0
    },

    makeTargetAnimatable(
        element,
        { transition, transitionEnd, ...target },
        { transformValues },
        isMounted = true
    ) {
        isMounted &&
            checkTargetForNewValues(
                element,
                target,
                (getOrigin(target as any, transition || {}, element) as any) ||
                    {}
            )

        return { transition, transitionEnd, ...target }
    },

    /**
     * TODO. Look through the props and return a map of motion values
     * or values that should be
     */
    scrapeMotionValuesFromProps(props) {
        return {}
    },

    /**
     * TODO:
     * Delete references of this key from the render state
     */
    removeValueFromMutableState(key, renderState) {},

    /**
     * Layout projection methods - currently unused
     */
    measureViewportBox() {
        return axisBox()
    },
    resetTransform() {},
    restoreTransform() {},

    build(
        _element,
        renderState,
        {
            x,
            y,
            z,
            scaleX,
            scaleY,
            scaleZ,
            scale,
            rotateX,
            rotateY,
            rotateZ,
            ...latest
        },
        _projection,
        _layoutState,
        _options,
        props
    ) {
        makeVector3(renderState, "position", x, y, z, props)
        makeVector3(
            renderState,
            "scale",
            scaleX,
            scaleY,
            scaleZ,
            props,
            scale ?? 1
        )
        makeVector3(renderState, "rotation", rotateX, rotateY, rotateZ, props)

        for (const key in latest) renderState.latest[key] = latest[key]
    },

    /**
     * TODO:
     * Take the latest values as built into renderState and apply them directly
     * to the threeObject
     */
    render(threeObject, { position, scale, rotation, latest }) {
        if (position) threeObject.position.set(...position)
        if (scale) threeObject.scale.set(...scale)
        if (rotation) threeObject.rotation.set(...rotation)

        for (const key in latest) {
            if (setter[key]) {
                setter[key](threeObject, key, latest[key])
            } else {
                threeObject[key] = latest[key]
            }
        }
    },
}

function setOnMaterial(threeObject: any, key: string, value: number) {
    if (threeObject.material) {
        if (key === "color") {
            threeObject.material[key] = new Three.Color(value)
        } else {
            threeObject.material[key] = value
        }
    }
}

const setter = {
    color: setOnMaterial,
    opacity: setOnMaterial,
}

function makeVector3(
    renderState: ThreeRenderState,
    name: string,
    a?: number,
    b?: number,
    c?: number,
    props?: any,
    defaultValue?: number
) {
    /**
     * If none of these values exist, delete the renderState (if it exists)
     */
    if (
        a === undefined &&
        b === undefined &&
        c === undefined &&
        defaultValue === undefined
    ) {
        delete renderState[name]
        return
    }

    if (!renderState[name]) {
        renderState[name] = [0, 0, 0]
    }

    const value = renderState[name]
    value[0] = a ?? props[name]?.[0] ?? defaultValue
    value[1] = a ?? props[name]?.[1] ?? defaultValue
    value[2] = a ?? props[name]?.[2] ?? defaultValue
}

export const threeVisualElement = visualElement(config)
