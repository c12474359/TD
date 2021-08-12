export const Loaders = {
  loadMtl: (src,onload,onprogress,onerror) => {
    import("three/examples/jsm/loaders/MTLLoader.js").then(({ MTLLoader }) => {
      const loader = new MTLLoader()
      loader.load(src,onload,onprogress,onerror)
    })
  },
  loadTga: (src,onload,onprogress,onerror) => {
    import("three/examples/jsm/loaders/TGALoader.js").then(({TGALoader}) => {
      const loader = new TGALoader()
      loader.load(src,onload,onprogress,onerror)
    })
  },
  loadObj: (src,onload,onprogress,onerror,materials)  => {
    import("three/examples/jsm/loaders/OBJLoader.js").then(({ OBJLoader }) => {
      const loader = new OBJLoader()
      materials ? loader.setMaterials(materials) : undefined
      loader.load(src,onload,onprogress,onerror)
    })
  },
  loadFbx: (src,onload,onprogress,onerror)  => {
    import("three/examples/jsm/loaders/FBXLoader").then(({ FBXLoader }) => {
      const loader = new FBXLoader()
      loader.load(src,onload,onprogress,onerror)
    })
  },
  load3DM:(src,onload,onprogress,onerror)  => {
    import("three/examples/jsm/loaders/3DMLoader").then(({ Rhino3dmLoader }) => {
      const loader = new Rhino3dmLoader()
      // materials ? loader.setMaterials(materials) : undefined
      loader.load(src,onload,onprogress,onerror)
    })
  }
}