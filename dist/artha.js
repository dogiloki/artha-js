// src/helpers/DataHelper.js
function getValueByPath(obj, path, default_value = null) {
  return path.split(".").reduce((o, p) => o ? o[p] : default_value, obj);
}
function formDataToArray(form_data) {
  let data = {};
  form_data.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}
function arrayRemove(array, item_remove) {
  if (Array.isArray(array)) {
    return array.filter((item) => item !== item_remove);
  } else if (typeof array === "object") {
    let array_filter = {};
    for (let key in array) {
      if (array.hasOwnProperty(key) && array[key] !== item_remove) {
        array_filter[key] = array[key];
      }
    }
    array = array_filter;
    return array;
  }
  return array;
}
function iterate(count, action, params = []) {
  let elements = [];
  for (let index = 0; index < count; index++) {
    elements.push(action(index, ...params));
  }
  return elements;
}
var DataHelper = class {
  static getValueByPath = getValueByPath;
  static formDataToArray = formDataToArray;
  static arrayRemove = arrayRemove;
  static iterate = iterate;
};

// src/helpers/DOMHelper.js
function getMeta(name) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return meta ? meta.getAttribute("content") : null;
}
function modal(content, visible = -1) {
  content.style.display = visible == -1 ? content.style.display == "none" ? "block" : "none" : visible ? "block" : "none";
  if (visible == -1) {
    content.classList.toggle("hidden");
    if (content.hasAttribute("hidden")) {
      content.removeAttribute("hidden");
    }
  } else {
    if (visible) {
      content.classList.remove("hidden");
      content.removeAttribute("hidden");
    } else {
      content.classList.add("hidden");
      content.setAttribute("hidden", "");
    }
  }
}
function modalById(id, visible = -1) {
  modal(document.getElementById(id), visible);
}
function createElement(type, value = null, options = {}) {
  try {
    const el = document.createElement(type, options);
    if (value === null) return el;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        el.appendChild(item);
      });
    } else if (typeof value === "function") {
      value(el);
    } else {
      el.textContent = value;
    }
    return el;
  } catch (ex) {
    throw new Error(ex, { cause: ex });
  }
}
function addClassPresent(item, value) {
  if (!item.classList.contains(value)) {
    item.classList.add(value);
  }
}
function removeClassPresent(item, value) {
  if (item.classList.contains(value)) {
    item.classList.remove(value);
  }
}
function loadTabContainer(tabs_container) {
  const tab_titles = tabs_container.getElementsByClassName("tab-title");
  const tab_items = tabs_container.getElementsByClassName("tab-item");
  const items = [];
  let tab_title_selected = null;
  let index = 0;
  for (const tab_title of tab_titles) {
    if (tab_title_selected == null && tab_title.hasAttribute("selected")) {
      tab_title_selected = tab_title;
    }
    const tab_item = tab_items[index];
    const inputs = tab_item.querySelectorAll(Util.query_element_inputs);
    const item = {
      inputs,
      tab_title,
      tab_item,
      validityInputs: (input = null) => {
        let has_count_invalid_inputs = tab_title.hasAttribute("invalid-inputs") && input != null;
        let count_invalid_inputs = 0;
        if (has_count_invalid_inputs) {
          count_invalid_inputs = tab_title.getAttribute("invalid-inputs");
          if (input.checkValidity()) {
            count_invalid_inputs--;
          } else {
            count_invalid_inputs++;
          }
        } else {
          for (const input2 of inputs) {
            if (!input2.checkValidity()) {
              count_invalid_inputs++;
            }
          }
        }
        tab_title.setAttribute("invalid-inputs", count_invalid_inputs);
        return count_invalid_inputs;
      }
    };
    items.push(item);
    tab_title.addEventListener("click", (evt) => {
      items.forEach((item2) => {
        item2.tab_title.removeAttribute("selected");
        Util.modal(item2.tab_item, false);
        item2.validityInputs();
      });
      tab_title.setAttribute("selected", true);
      Util.modal(tab_item, true);
    });
    index++;
    for (const input of inputs) {
      input.addEventListener("change", (evt) => {
        item.validityInputs();
      });
    }
    item.validityInputs();
  }
  if (tab_title_selected != null) {
    tab_title_selected.click();
  }
}
function jsonViewer(json) {
  let element_viewer = Util.createElement("div", (element_viewer2) => {
    element_viewer2.classList.add("json-viewer");
  });
  if (json == null) return element_viewer;
  function addItem(element_viewer2, json2) {
    if (Array.isArray(json2)) {
      let element_array = createElement("div", (element_array2) => {
        element_array2.classList.add("json-array");
      });
      for (let item of json2) {
        Object.entries(item).forEach(([key, value]) => {
          element_array.appendChild(createElement("div", (element_item) => {
            element_item.classList.add("json-item");
            element_item.appendChild(createElement("div", (item_key) => {
              item_key.classList.add("json-key");
              item_key.textContent = key;
            }));
            if (Array.isArray(value)) {
              element_item.appendChild(addItem(element_array, value));
            } else {
              element_item.appendChild(createElement("div", (item_value) => {
                item_value.classList.add("json-value");
                item_value.textContent = value;
              }));
            }
          }));
        });
      }
      return element_array;
    } else {
      return element_viewer2;
    }
  }
  element_viewer.appendChild(addItem(element_viewer, json));
  return element_viewer;
}
var DOMHelper = class {
  static getMeta = getMeta;
  static modal = modal;
  static modalById = modalById;
  static createElement = createElement;
  static addClassPresent = addClassPresent;
  static removeClassPresent = removeClassPresent;
  static loadTabContainer = loadTabContainer;
  static jsonViewer = jsonViewer;
};

// src/helpers/FormatHelper.js
function formatMoney(value, options = {}) {
  const {
    locale = this.defaults.locale,
    currency = this.defaults.currency,
    digits = this.defaults.money.digits,
    style = this.defaults.money.style
  } = options;
  value = value.toString();
  let amount = Number(value.replace(/[^0-9.]/g, ""));
  if (isNaN(amount)) {
    return value;
  }
  let minimum = 0;
  return new Intl.NumberFormat(locale, {
    style,
    currency,
    minimum,
    digits
  }).format(amount);
}
function formatTime(text, quantity = 3, str = true) {
  let array = text.split(":");
  for (let index = 0; index < quantity; index++) {
    array[index] ??= "00";
  }
  return array.slice(0, quantity).join(":") + (str ? "hrs" : "");
}
function formatSize(value) {
  let units = ["B", "KB", "MB", "GB", "TB", "PT", "EB", "ZB", "YB"];
  let index = 0;
  while (value > 1024) {
    value /= 1024;
    index++;
  }
  return Number(value).toFixed(2) + " " + units[index];
}
var FormatHelper = class {
  static formatMoney = formatMoney;
  static formatTime = formatTime;
  static formatSize = formatSize;
};

// src/helpers/FormHelper.js
function loadTabContainer2(tabs_container) {
  const tab_titles = tabs_container.getElementsByClassName("tab-title");
  const tab_items = tabs_container.getElementsByClassName("tab-item");
  const items = [];
  let tab_title_selected = null;
  let index = 0;
  for (const tab_title of tab_titles) {
    if (tab_title_selected == null && tab_title.hasAttribute("selected")) {
      tab_title_selected = tab_title;
    }
    const tab_item = tab_items[index];
    const inputs = tab_item.querySelectorAll(Util.query_element_inputs);
    const item = {
      inputs,
      tab_title,
      tab_item,
      validityInputs: (input = null) => {
        let has_count_invalid_inputs = tab_title.hasAttribute("invalid-inputs") && input != null;
        let count_invalid_inputs = 0;
        if (has_count_invalid_inputs) {
          count_invalid_inputs = tab_title.getAttribute("invalid-inputs");
          if (input.checkValidity()) {
            count_invalid_inputs--;
          } else {
            count_invalid_inputs++;
          }
        } else {
          for (const input2 of inputs) {
            if (!input2.checkValidity()) {
              count_invalid_inputs++;
            }
          }
        }
        tab_title.setAttribute("invalid-inputs", count_invalid_inputs);
        return count_invalid_inputs;
      }
    };
    items.push(item);
    tab_title.addEventListener("click", (evt) => {
      items.forEach((item2) => {
        item2.tab_title.removeAttribute("selected");
        DOMHelper(item2.tab_item, false);
        item2.validityInputs();
      });
      tab_title.setAttribute("selected", true);
      DOMHelper(tab_item, true);
    });
    index++;
    for (const input of inputs) {
      input.addEventListener("change", (evt) => {
        item.validityInputs();
      });
    }
    item.validityInputs();
  }
  if (tab_title_selected != null) {
    tab_title_selected.click();
  }
}
function sync(element1, element2, {
  event = "keyup",
  mutual = false,
  content1 = {
    event: null
  },
  content2 = {
    event: null
  }
} = {}) {
  element1.addEventListener(content1.event ?? event, (evt) => {
    element2.value = element1.value;
  });
  if (mutual) {
    element2.addEventListener(content2.event ?? event, (evt) => {
      element1.value = element2.value;
    });
  }
}
var FormHelper = class {
  static loadTabContainer = loadTabContainer2;
  static sync = sync;
};

// src/helpers/NumberHelper.js
function changeNumberSign(num) {
  return num > 0 ? -num : num;
}
function numberChange(actual, min, max, direccion = Util.IZQ) {
  if (direccion == Util.IZQ) {
    if (actual < max) {
      actual++;
    } else {
      actual = min;
    }
  } else if (direccion == Util.DER) {
    if (actual > min) {
      actual--;
    } else {
      actual = max;
    }
  }
  return actual;
}
function numberRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function withinRange(value, min, max) {
  return value >= min && value <= max;
}
var NumberHelper = class {
  static changeNumberSign = changeNumberSign;
  static numberChange = numberChange;
  static numberRandom = numberRandom;
  static withinRange = withinRange;
};

// src/helpers/StringHelper.js
function convertText(texto) {
  return texto.codePointAt(0) - 64;
}
function convertNum(num) {
  return String.fromCodePoint(num + 64);
}
var StringHelper = class {
  static convertText = convertText;
  static convertNum = convertNum;
};

// src/core/EventBus.js
var EVENT_BUS = new EventTarget();
var EventBus = class {
  static debug = false;
  static listeners = /* @__PURE__ */ new Map();
  static any_listeners = /* @__PURE__ */ new Set();
  // Emitir evento
  static emit(name, data) {
    if (this.debug) {
      try {
        console.log(`[EventBus] emit -> ${name}`, structuredClone(data));
      } catch (ex) {
        console.log(`[EventBus] emit -> ${name}`, data);
      }
    }
    this.any_listeners.forEach((cb) => {
      try {
        cb(name, data);
      } catch (ex) {
        console.error(`[EventBus error] ${name}`, ex);
      }
    });
    EVENT_BUS.dispatchEvent(new CustomEvent(name, { detail: data }));
  }
  // Emitir y esperar promesa (async listeners)
  static emitAsync(name, data) {
    this.any_listeners.forEach((cb) => {
      try {
        cb(name, data);
      } catch (ex) {
        console.error(`[EventBus error] ${name}`, ex);
      }
    });
    const listeners = this.listeners.get(name) || [];
    const results = listeners.map(async ({ callback }) => {
      try {
        return await callback(data);
      } catch (ex) {
        console.error(`[EventBus error] ${name}`, ex);
        return null;
      }
    });
    return Promise.all(results);
  }
  // Escuchar evento
  static on(name, callback) {
    const handler = (evt) => {
      callback(evt.detail);
    };
    EVENT_BUS.addEventListener(name, handler);
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name).push({ callback, handler });
    return () => this.off(name, callback);
  }
  // Escucha una sola vez
  static once(name, callback) {
    const handler = (evt) => {
      callback(evt.detail);
      this.off(name, callback);
    };
    EVENT_BUS.addEventListener(name, handler, { once: true });
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name).push({ callback, handler });
  }
  // Escuchar todos los eventos
  static onAny(callback) {
    this.any_listeners.add(callback);
    return () => this.any_listeners.delete(callback);
  }
  // Remover listener manualmente
  static off(name, callback) {
    if (!this.listeners.has(name)) return;
    const arr = this.listeners.get(name);
    const filtered = arr.filter((item) => {
      if (item.callback === callback) {
        EVENT_BUS.removeEventListener(name, item.handler);
        return false;
      }
      return true;
    });
    if (filtered.length !== arr.length) {
      this.listeners.set(name, filtered);
    }
    if (filtered.length === 0) {
      this.listeners.delete(name);
    }
  }
  // Limpiar todos los listeners de un evento
  static clean(name) {
    if (!this.listeners.has(name)) return;
    const arr = this.listeners.get(name);
    arr.forEach(({ handler }) => {
      EVENT_BUS.removeEventListener(name, handler);
    });
    this.listeners.delete(name);
  }
  // Limpiar todo
  static clearAll() {
    this.listeners.forEach((arr, name) => {
      arr.forEach(({ handler }) => {
        EVENT_BUS.removeEventListener(name, handler);
      });
    });
    this.listeners.clear();
    this.any_listeners.clear();
  }
};

// src/abstract/BaseComponent.js
var BaseComponent = class _BaseComponent extends HTMLElement {
  static counter = 0;
  // Método estático para definir atributos observados
  static get observedAttributes() {
    return [];
  }
  constructor(props = null, options = {}) {
    super();
    _BaseComponent.counter += 1;
    this._elements = {};
    this._updating = false;
    this._props = [];
    this._memory = {};
    this._special_props = {
      booleans: [],
      // Propiedades booleanas
      element_refs: [],
      // Propiedades de referencian elementos por ID
      defaults: {},
      // Propiedades con valor por defecto
      resolvers: {},
      // Propiedades con un callback
      reflect: {}
      // Guardar en memoria y no llamar a setAttribute y getAttribute
    };
    this.configureProperties(props, options);
    this._initialize_properties = false;
  }
  connectedCallback() {
    if (!this._initialize_properties) {
      this._initializeProperties();
      this._initialize_properties = true;
    }
    this.onConnected();
    this.dispatchEvent(new CustomEvent("component-ready", {
      detail: this,
      bubbles: true
    }));
  }
  onConnected() {
  }
  disconnectedCallback() {
    this.onDisconnected();
    this.clearElementCache();
  }
  onDisconnected() {
  }
  attributeChangedCallback(name, old_value, new_value) {
    if (old_value === new_value) return;
    const attr = this._valueToAttr(name);
    if (this._props.includes(attr)) {
      this._triggerUpdate(attr, this._getPropertyValue(attr));
    }
    this.onAttributeChanged(attr, old_value, new_value);
  }
  onAttributeChanged(prop, old_value, new_value) {
  }
  configureProperties(props, options = {}) {
    if (props == null) return;
    this._props = props;
    this._special_props = {
      booleans: options.booleans || [],
      element_refs: options.element_refs || [],
      defaults: options.defaults || {},
      resolvers: options.resolvers || {},
      reflect: options.reflect || {}
    };
    this._setupProperties();
  }
  _isReflected(prop) {
    return this._special_props.reflect[prop] !== false;
  }
  _getAttribute(attr) {
    return this.getAttribute(this._valueToAttr(attr));
  }
  _setAttribute(attr, value) {
    return this.setAttribute(this._valueToAttr(attr), value);
  }
  _removeAttribute(attr) {
    return this.removeAttribute(this._valueToAttr(attr));
  }
  _hasAttribute(attr) {
    return this.hasAttribute(this._valueToAttr(attr));
  }
  _valueToAttr(value) {
    return value.replace(/_/g, "-");
  }
  _attrToValue(value) {
    return value.replace(/-/g, "_");
  }
  _setupProperties() {
    this._props.forEach((prop) => {
      Object.defineProperty(this, prop, {
        get: () => this._getPropertyValue(prop),
        set: (value) => this._setPropertyValue(prop, value),
        enumerable: true,
        configurable: true
      });
    });
  }
  _getPropertyValue(prop) {
    if (!this._isReflected(prop)) {
      if (prop in this._memory) {
        return this._memory[prop];
      }
      if (this._special_props.defaults[prop] !== void 0) {
        return this._special_props.defaults[prop];
      }
      return null;
    }
    if (this._special_props.element_refs.includes(prop)) {
      const element_id = this._getAttribute(prop);
      if (!element_id) {
        return this._elements[prop] ?? null;
      }
      if (!this._elements[prop] || this._elements[prop].id !== element_id) {
        this._elements[prop] = document.getElementById(element_id);
      }
      return this._elements[prop];
    }
    if (this._special_props.resolvers[prop]) {
      const raw_value = this._getAttribute(prop);
      return this._special_props.resolvers[prop].get(raw_value, this);
    }
    if (this._special_props.booleans.includes(prop)) {
      return this._hasAttribute(prop) && this._getAttribute(prop) !== "false";
    }
    const value = this._getAttribute(prop);
    if (value === null && this._special_props.defaults[prop] !== void 0) {
      return this._special_props.defaults[prop];
    }
    return value;
  }
  _setPropertyValue(prop, value) {
    if (this._updating) return;
    if (this._isReflected(prop) === false) {
      this._memory[prop] = value;
      this._triggerUpdate(prop, value);
      return;
    }
    const current_value = this._getAttribute(prop);
    let new_value = value;
    if (value === null || value === void 0) {
      new_value = null;
    } else if (typeof value === "boolean") {
      new_value = value ? "" : null;
    } else if (typeof value === "object") {
      this._elements[prop] = value;
      this._triggerUpdate(prop, value);
      return;
    } else if (this._special_props.resolvers[prop]) {
      new_value = this._special_props.resolvers[prop].set(value, this);
      this._triggerUpdate(prop, value);
    } else {
      new_value = String(value);
    }
    if (current_value !== new_value) {
      if (new_value === null) {
        this._removeAttribute(prop);
      } else {
        this._setAttribute(prop, new_value);
      }
      this._triggerUpdate(prop, value);
    }
  }
  _initializeProperties() {
    this._props.forEach((prop) => {
      if (this._isReflected(prop) === false) {
        if (this._special_props.defaults[prop] !== void 0) {
          this._memory[prop] = this._special_props.defaults[prop];
        }
        return;
      }
      const attrib_value = this._getAttribute(prop);
      if (attrib_value !== null) {
        this[prop] = this._getPropertyValue(prop);
      } else if (this._special_props.defaults[prop] !== void 0) {
        this[prop] = this._special_props.defaults[prop];
      }
    });
  }
  _triggerUpdate(prop, value) {
    if (this._updating) return;
    this._updating = true;
    this.dispatchEvent(new CustomEvent(`${prop}-changed`, {
      detail: {
        property: prop,
        value,
        component: this
      },
      bubbles: true
    }));
    this.dispatchEvent(new CustomEvent("property-changed", {
      detail: {
        property: prop,
        value,
        component: this
      },
      bubbles: true
    }));
    this.onPropertyChanged(prop, value);
    this._updating = false;
  }
  onPropertyChanged(prop, value) {
  }
  setProperties(props) {
    this._updating = true;
    Object.entries(props).forEach(([key, value]) => {
      if (this._props.includes(key)) {
        this[key] = value;
      }
    });
    this._updating = false;
    this._triggerUpdate("batch", props);
  }
  getProperties() {
    const props = {};
    this._props.forEach((prop) => {
      props[prop] = this[prop];
    });
    return props;
  }
  clearElementCache() {
    this._elements = {};
  }
};

// src/components/artha-message.js
var ArthaMessage = class _ArthaMessage extends BaseComponent {
  static TYPE = Object.freeze({
    ERROR: {
      code: -1,
      name: "error"
    },
    INFO: {
      code: 0,
      name: "info"
    },
    SUCCESS: {
      code: 1,
      name: "success"
    },
    WARNING: {
      code: 2,
      name: "warning"
    }
  });
  constructor() {
    super();
    this._initialized = false;
  }
  onConnected() {
    if (this._initialized) return;
    this.type = this.getAttribute("type") || _ArthaMessage.TYPE.INFO.name;
    this.hidden();
    this._initialized = true;
  }
  onDisconnected() {
    this._initialized = false;
  }
  error(message = null) {
    this.show(message, _ArthaMessage.TYPE.ERROR);
  }
  info(message = null) {
    this.show(message, _ArthaMessage.TYPE.INFO);
  }
  success(message = null) {
    this.show(message, _ArthaMessage.TYPE.SUCCESS);
  }
  warning(message = null) {
    this.show(message, _ArthaMessage.TYPE.WARNING);
  }
  show(message = null, type = null) {
    if (!message || type == null) return this.hidden();
    if (type) this.setAttribute("type", (typeof type === "string" ? type : type.name) || _ArthaMessage.TYPE.INFO.name);
    if (message) this.innerHTML = message;
    DOMHelper.modal(this, true);
  }
  hidden() {
    DOMHelper.modal(this, false);
  }
};

// src/core/XHR.js
var XHR = class _XHR {
  static defaults = {
    method: "GET",
    url: null,
    uri: "",
    headers: {},
    data: {},
    query: {},
    files: {},
    response_type: "json",
    with_credentials: false,
    timeout: 0,
    retry: false,
    retry_delay: 5e3,
    transformResponse: (xhr) => {
      return xhr.response;
    },
    onLoad: () => {
    },
    onData: () => {
    },
    onError: () => {
    },
    onTimeout: () => {
    },
    onProgress: () => {
    },
    onAbort: () => {
    },
    onAction: () => {
    }
  };
  static request(options) {
    options = { ...this.defaults, ...options };
    const {
      method,
      url,
      uri,
      headers,
      data,
      query,
      files,
      response_type,
      with_credentials,
      timeout,
      retry,
      retry_delay,
      transformResponse,
      onLoad,
      onData,
      onError,
      onTimeout,
      onProgress,
      onAbort,
      onAction
    } = options;
    const safeTransform = (xhr2) => {
      try {
        return transformResponse(xhr2);
      } catch (ex) {
        console.error("transformResponse error:", ex);
        return xhr2.response;
      }
    };
    const xhr = new XMLHttpRequest();
    const query_string = Object.keys(query).length ? "?" + Object.entries(query).filter(([_, v]) => v != null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&") : "";
    xhr.open(method, url + uri + query_string, true);
    xhr.responseType = response_type;
    xhr.withCredentials = with_credentials;
    xhr.timeout = timeout;
    const token = DOMHelper.getMeta("csrf-token") ?? DOMHelper.getMeta("csrf_token");
    if (token) {
      xhr.setRequestHeader("X-CSRF-Token", token);
    }
    for (let key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }
    let body = null;
    if (method !== "GET") {
      const form_data = new FormData();
      if (token) form_data.append("csrf_token", token);
      form_data.append("_method", method);
      for (let key in data) {
        form_data.append(key, data[key]);
      }
      for (let key in files) {
        const value = files[key];
        if (Array.isArray(value) || value instanceof FileList) {
          for (let index = 0; index < value.length; index++) {
            form_data.append(`${key}[]`, value[index]);
          }
        } else {
          form_data.append(key, value);
        }
      }
      body = form_data;
    }
    xhr.addEventListener("load", () => {
      onLoad(xhr);
      if (NumberHelper.withinRange(xhr.status, 200, 299)) {
        onData(xhr, safeTransform(xhr));
      } else {
        onError(safeTransform(xhr));
      }
    });
    xhr.addEventListener("error", () => {
      const retry_options = { ...options };
      if (retry) {
        setTimeout(() => {
          _XHR.request(retry_options);
        }, retry_delay);
      }
      onError(safeTransform(xhr));
    });
    xhr.addEventListener("abort", () => {
      onAbort(safeTransform(xhr));
    });
    xhr.addEventListener("timeout", () => {
      const retry_options = { ...options };
      if (retry) {
        setTimeout(() => {
          _XHR.request(retry_options);
        }, retry_delay);
      }
      onTimeout(safeTransform(xhr));
    });
    xhr.addEventListener("progress", (evt) => {
      onProgress(evt, evt.loaded, evt.total);
    });
    onAction(xhr);
    xhr.send(body);
    return xhr;
  }
};

// src/core/TaskQueue.js
var TaskQueue = class _TaskQueue {
  static defaults = {
    title: "Petici\xF3n en proceso...",
    close: false,
    message: null
  };
  static INSTNACE = null;
  static singleton() {
    if (!this.INSTNACE) {
      this.INSTNACE = new _TaskQueue();
    }
    return this.INSTNACE;
  }
  constructor() {
    this.queues = /* @__PURE__ */ new Map();
  }
  // Crear una nueva tarea
  loadTask(id, title, callback, options = {}) {
    if (typeof options !== "object") {
      options = { close: options };
    }
    if (this.queues.has(id)) {
      alert("La petici\xF3n ya est\xE1 en proceso... Por favor espere.");
      return null;
    }
    if (title) options.title = title;
    const task = new TaskQueueItem(id, callback, options);
    task.onFinalize = (remove = false) => {
      if (remove && !task.finalized) {
        task.message_element.warning(task.options.title);
        return;
      }
      task.finalized = true;
      this.queues.delete(id);
      if (task.options.close || remove) {
        setTimeout(() => task.removeElement(), task.options.close ? 2500 : 0);
      }
    };
    this.queues.set(id, task);
    return task;
  }
};
var TaskQueueItem = class {
  constructor(id, callback, options) {
    this.id = id;
    this.callback = callback;
    options = { ...TaskQueue.defaults, ...options };
    const {
      title,
      close,
      message
    } = options;
    this.options = options;
    this.message_element = options.message instanceof ArthaMessage ? options.message : document.querySelector("#" + options.message) ?? null;
    this.resolve_callback = null;
    this.reject_callback = null;
    this.finalized = false;
    this.status = "pending";
    this.message_element?.warning(options.title);
    this.onFinalize = () => {
    };
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    callback(this);
    this.promise.then((data) => {
      this.handleResponse(data);
    });
    this.promise.catch((error) => {
      this.message_element?.error(error?.message || String(error));
      this.status = "error";
      this.reject_callback?.(error);
      this.onFinalize();
    });
  }
  // Procesar respuesta
  handleResponse(data) {
    if (!data) {
      this.message_element?.error("Error en la respuesta del servidor");
      this.status = "error";
      this.onFinalize();
      return;
    }
    let response;
    try {
      response = XHR.defaults.transformResponse(data);
    } catch (err) {
      response = data;
    }
    response.status ??= NumberHelper.withinRange(data.status, 200, 299) ? "success" : "error";
    if (response instanceof Blob) {
      this.status = "success";
      this.resolve_callback?.(response);
      this.onFinalize();
      return;
    }
    let json;
    try {
      json = typeof response === "string" ? JSON.parse(response) : response;
      if (!json || typeof json !== "object") {
        throw new Error("Respuesta inv\xE1lida del servidor");
      }
    } catch (ex) {
      this.message_element?.error(ex.message || String(ex));
      this.status = "error";
      this.onFinalize();
      return;
    }
    let message = null;
    if (json.errors && typeof json.errors === "object") {
      const values = Object.values(json.errors);
      if (values.length > 0) {
        const first = values[0];
        message = Array.isArray(first) ? first[0] : first;
      }
    }
    message = message || json.message || "Operaci\xF3n completada";
    if (NumberHelper.withinRange(data.status, 200, 299)) {
      if (message) {
        this.message_element?.show(message, json?.status ?? null);
      } else {
        this.message_element?.success("Operaci\xF3n completada");
      }
      this.status = json?.status || "success";
    } else {
      if (message) {
        this.message_element?.show(message, json?.status ?? null);
      } else {
        this.message_element?.error("Error en la respuesta del servidor");
      }
      this.status = json?.status || "error";
      this.onFinalize();
      return;
    }
    this.resolve_callback?.(json);
    this.onFinalize();
  }
  // Resolver manualmente
  resolve(data, callback) {
    this.resolve_callback = callback;
    this._resolve(data);
  }
  // Recahzar manualmente
  reject(error) {
    this._reject(error);
  }
  removeElement() {
  }
};

// src/components/loaders/LoaderBase.js
var LoaderBase = class {
  constructor(type, text) {
    this.type = type;
    this.text = text;
  }
  renderType() {
    return DOMHelper.createElement("div", (div) => {
      div.classList.add("loader-content");
    });
  }
  renderLoader = (loader) => {
    loader.appendChild(document.createElement("div"));
  };
  renderText() {
    return DOMHelper.createElement("span", this.text);
  }
  render() {
    let loader = this.renderType();
    this.renderLoader(loader);
    return [loader, this.renderText()];
  }
};

// src/components/loaders/LoaderDots.js
var LoaderDots = class extends LoaderBase {
  renderLoader = (loader) => {
    loader.appendChild(document.createElement("div"));
    loader.appendChild(document.createElement("div"));
    loader.appendChild(document.createElement("div"));
  };
};

// src/components/loaders/LoaderRing.js
var LoaderRing = class extends LoaderBase {
};

// src/components/artha-loader.js
var ArthaLoader = class _ArthaLoader extends BaseComponent {
  static TYPE = Object.freeze({
    DOTS: {
      name: "dots",
      clazz: LoaderDots
    },
    RING: {
      name: "ring",
      clazz: LoaderRing
    },
    BAR: {
      name: "bar",
      clazz: LoaderDots
    },
    WAVE: {
      name: "wave",
      clazz: LoaderDots
    }
  });
  constructor() {
    super(
      ["type", "text"],
      {
        defaults: {
          type: _ArthaLoader.TYPE.RING.name,
          text: TaskQueue.defaults.title
        },
        resolvers: {
          type: {
            get: (value) => {
              return Object.values(_ArthaLoader.TYPE).find((item) => {
                return item.name == value;
              })?.clazz;
            },
            set: (value) => {
              return Object.values(_ArthaLoader.TYPE).find((item) => {
                return item.clazz == value;
              })?.name || value;
            }
          }
        }
      }
    );
    this._initialized = false;
    this._property_changed = () => {
      this.render();
    };
  }
  onConnected() {
    if (this._initialized) return;
    this.addEventListener("property-changed", this._property_changed);
    try {
      this.render();
      this._initialized = true;
    } catch (err) {
      this.removeEventListener("property-changed", this._property_changed);
      throw err;
    }
  }
  onDisconnected() {
    this.removeEventListener("property-changed", this._property_changed);
    this._initialized = false;
  }
  getLoaderInstance() {
    const loader_class = this.type;
    return new loader_class(this.getAttribute("type"), this.text);
  }
  render() {
    const content = this.getLoaderInstance().render();
    this.replaceChildren(...content);
  }
};

// src/components/artha-container.js
var ArthaContainer = class _ArthaContainer extends BaseComponent {
  static defaults = {
    method: "GET",
    pagination: 10,
    page: 1,
    response_type: "json"
  };
  constructor() {
    super(
      [
        "template",
        "action",
        "action_router",
        "method",
        "page",
        "search",
        "pagination",
        "message",
        "searcher",
        "selectable",
        "multiple",
        "response_type"
      ],
      {
        booleans: ["searcher", "selectable", "multiple"],
        element_refs: ["template", "message"],
        defaults: {
          response_type: _ArthaContainer.defaults.response_type
        },
        reflect: {
          search: false,
          response_type: false
        }
      }
    );
    this.onRenderItem = (element, data) => {
    };
    this.onRenderItemFill = (element, data, fill_element, fill_data) => {
    };
    this.onRenderItemIter = (element, data, iter_element, iter_data) => {
    };
    this.task_queue = TaskQueue.singleton();
    this._current_xhr = null;
    this.items = {};
    this.selection_store = new SelectionStore();
    this._initialized = false;
    this._onSearch = (evt) => this._handleSearch(evt);
    this._onCancelSearch = (evt) => this._cancelSearch(evt);
  }
  onConnected() {
    if (this._initialized) return;
    this.message ??= this.querySelector("artha-message") ?? this.querySelector(this.getAttribute("message-target")) ?? null;
    this.id = this.getAttribute("id") ?? "container-" + BaseComponent.counter;
    if (this.hasPagination()) {
      this.pagination = this.pagination || _ArthaContainer.defaults.pagination;
      this.page = this.page || _ArthaContainer.defaults.page;
    }
    if (this.hasAction()) {
      this.method = this.method || _ArthaContainer.defaults.method;
    }
    this.loader_container = this._createLoader();
    if (this.searcher) {
      this.searcher_input = DOMHelper.createElement("input-search");
      this.appendChild(this.searcher_input);
      this.searcher_input.addEventListener("search", this._onSearch);
      this.searcher_input.addEventListener("cancel-search", this._onCancelSearch);
    }
    this.content = this.querySelector(":scope > dynamic-content") || this.appendChild(document.createElement("dynamic-content"));
    this._content = this.content.children[0];
    if (this.hasAction()) {
      if (this.searcher) {
        this.refresh(this.searcher_input.value);
      } else {
        this.refresh();
      }
    }
    const channels = (this.getAttribute("refresh-on") || "").split(",").map((c) => c.trim()).filter((c) => c.length > 0);
    this._refresh_listeners = [];
    for (const channel of channels) {
      const listener = (evt) => evt?.detail ? this.refreshWithData(evt.detail) : this.refresh();
      EventBus.on(channel, listener);
      this._refresh_listeners.push({ channel, listener });
    }
    this._initialized = true;
  }
  onDisconnected() {
    for (const { channel, listener } of this._refresh_listeners ?? []) {
      EventBus.off(channel, listener);
    }
    this.searcher_input?.removeEventListener("search", this._onSearch);
    this.searcher_input?.removeEventListener("cancel-search", this._onCancelSearch);
    this._current_xhr?.abort();
    this._current_xhr = null;
  }
  _createLoader() {
    return DOMHelper.createElement("artha-loader");
  }
  _handleSearch(evt) {
    this.page = 1;
    if (this.action) {
      this.search = evt.detail.query;
      return this.refresh();
    } else {
      const search = evt.detail.query?.toLowerCase() ?? "";
      for (const item of this.items) {
        DOMHelper.modal(item, item.textContent.toLowerCase().includes(search));
      }
    }
  }
  _cancelSearch(evt) {
    this._current_xhr?.abort();
    this._current_xhr = null;
  }
  // value - getter/setter
  get value() {
    if (!this.selectable) return null;
    return this.multiple ? this.selection_store.toValues() : this.selection_store.toValues()[0] ?? null;
  }
  set value(values) {
    if (!this.selectable) return;
    if (!Array.isArray(values)) values = [values];
    this.selection_store.clear();
    let count = 0;
    for (const item of this.items) {
      const id = item.dataset.id;
      if (values.includes(id)) {
        this.selection_store.add(id, item, item.data);
        item.classList.add("selected");
        if (!this.multiple && ++count >= 1) break;
      } else {
        item.classList.remove("selected");
      }
    }
  }
  getData(search = null) {
    search ??= this.search;
    if (!this.action) return;
    let query = {};
    if (this.hasPagination()) {
      query = {
        pagination: this.pagination,
        page: this.page
      };
    }
    if (search) {
      query["search"] = search;
    }
    return this.task_queue.loadTask(`container-${this.id}`, null, (task) => {
      this._current_xhr = XHR.request({
        url: this.action,
        method: this.method,
        headers: {
          "Accept": "application/json"
        },
        response_type: this.response_type,
        query: Object.keys(query).length ? query : {},
        onLoad: (xhr) => {
          this.dispatchEvent(new CustomEvent("load", { detail: xhr }));
        },
        onData: (xhr, json) => {
          this._current_xhr = null;
          task.resolve(xhr, () => {
            this.dispatchEvent(new CustomEvent("resolve", { detail: json }));
            if (json.message) {
              this.message?.show(json.message, json.status);
            }
            this.render(json.data);
          });
        },
        onError: (err) => {
          this.message?.error(err ?? "Error de conexi\xF3n");
          task.onFinalize();
          this._cancelSearch();
        },
        onAbort: (err) => {
          task.onFinalize();
          this._cancelSearch();
        }
      });
    }, {
      message: this.message
    });
  }
  hasAction() {
    return this.hasAttribute("action");
  }
  hasPagination() {
    return this.hasAttribute("pagination");
  }
  nextPage() {
    if (!this.hasPagination()) return;
    this.page += 1;
    return this.refresh(this.search);
  }
  prevPage() {
    if (!this.hasPagination()) return;
    if (this.page > 1) {
      this.page -= 1;
    }
    return this.refresh(this.search);
  }
  goToPage(page) {
    page = Number(page);
    if (!this.hasPagination() || !Number.isInteger(page) || page < 1) return;
    this.page = page;
    return this.refresh(this.search);
  }
  resetPagination(refresh = false) {
    this.page = 1;
    if (refresh) return this.refresh(this.search);
  }
  refresh(search = null) {
    search ??= this.search;
    this.loader_container.remove();
    if (this.template) {
      this.content.innerHTML = "";
      if (this._content) this.content.appendChild(this._content);
      this.content.appendChild(this.loader_container);
    }
    return this.getData(search);
  }
  refreshWithData(data) {
    if (!data) return;
    for (const child of this.content.querySelectorAll("[data-id]")) {
      if (child.dataset.id == data.id) this.renderItem(data, true, child);
    }
  }
  render(results, refresh = false, refresh_children = true) {
    if (!results) return;
    if (refresh) this.refresh();
    results = Array.isArray(results) ? results : [results];
    this.data = results;
    this.items = [];
    this.loader_container.remove();
    for (const data of results) this.renderItem(data, refresh_children);
    this.dispatchEvent(new CustomEvent("dynamic-content-loaded", { detail: results }));
  }
  renderItem(data, refresh_children = true, update = null) {
    if (!data) return;
    const template = this.template ? this.template.tagName === "TEMPLATE" ? this.template.content.cloneNode(true) : this.template.cloneNode(true) : this;
    const element = update ? update : this.template ? template.children[0] : this;
    const items = this._findWires(update ? element : template);
    let index = 0;
    for (const item of items) {
      const wires = item.getAttribute("data-wire").split(",").map((w) => w.trim()).filter((w) => w.length > 0);
      for (let wire of wires) {
        const [attrib_json, attrib_element, attrib_action] = wire.split(":");
        let value = attrib_json ? DataHelper.getValueByPath(data, attrib_json.replaceAll("[]", "")) : data[index] ?? "";
        const append = attrib_action === "append";
        const chooser = attrib_action === "chooser";
        const is_array = Array.isArray(value);
        const is_plain_array = is_array && value.every((v) => typeof v !== "object" || v === null);
        if (item.matches("artha-container")) {
          if (typeof item.render === "function") {
            item.render(value, false, refresh_children);
          } else {
            item.addEventListener("component-ready", () => {
              item.render(value, false, refresh_children);
            }, {
              once: true
            });
          }
        } else if (is_plain_array) {
          this._fillArray(item, data, value);
        } else {
          this._setValue(item, attrib_element, value, append, chooser);
        }
      }
    }
    if (!update) {
      this.items.push(element);
      element.data = data;
      element.dataset.id = data.id;
      if (this.selectable) this._bindSelectable(element, data);
    }
    this.onRenderItem(element, data);
    if (this.template && !update) this.content.appendChild(element);
    this.dispatchEvent(new CustomEvent("item-rendered", { detail: { item: element, data, index } }));
    index++;
  }
  _fillArray(item, data, value) {
    const fill_template = item.children[0].cloneNode(true);
    item.innerHTML = "";
    for (const fill of value ?? []) {
      const node = fill_template.cloneNode(true);
      const fill_elements = node.querySelectorAll("[fillable]");
      const iter_elements = node.querySelectorAll("[iterable]");
      fill_elements.forEach((element) => {
        this.onRenderItemFill(item, data, element, fill);
        element.textContent = fill;
        element.value = fill;
      });
      iter_elements.forEach((element) => {
        this.onRenderItemIter(item, data, element, fill);
      });
      item.appendChild(node);
    }
  }
  _setValue(item, attrib_element, value, append, chooser) {
    if (attrib_element) {
      if (append) {
        switch (attrib_element) {
          case "textcontent":
            value = item.textContent + value;
            break;
          case "innerhtml":
            value = item.innerhtml + value;
            break;
          default:
            value = item.getAttribute(attrib_element) + value;
        }
      }
      switch (attrib_element.toLowerCase()) {
        case "textcontent":
          item.textContent = value;
          break;
        case "innerhtml":
          item.innerhtml = value;
          break;
        case "boolean": {
          if (chooser) {
            let applied = false;
            const templates = item.querySelectorAll("template");
            for (const template of templates) {
              if (template.getAttribute("data-chooser-value") == value) {
                item.innerHTML = "";
                item.appendChild(template.content.cloneNode(true));
                applied = true;
                break;
              }
            }
            if (!applied) {
              const template = item.querySelector("template[data-chooser-default]")?.content?.cloneNode(true) ?? document.createElement("span");
              item.innerHTML = "";
              item.appendChild(template);
            }
          } else {
            item.innerHTML = "";
            item.appendChild(DOMHelper.createElement("span", (span) => {
              span.classList.add("check-cross");
              if (value) {
                span.classList.add("check-cross-yes");
                span.textContent = "\u2714";
              } else {
                span.classList.add("check-cross-no");
                span.textContent = "\u2718";
              }
            }));
          }
          break;
        }
        default:
          item.setAttribute(attrib_element, value);
      }
    } else {
      if (append) value = item.textContent + value;
      item.textContent = value;
    }
  }
  _bindSelectable(element, data) {
    const id = element.dataset.id;
    element.addEventListener("click", (evt) => {
      if (this.selection_store.has(id)) {
        const selection = this.selection_store.remove(id);
        this.dispatchEvent(new CustomEvent("item-deselected", { detail: selection }));
      } else {
        if (!this.multiple) this.reset();
        const selection = this.selection_store.add(id, element, data);
        this.dispatchEvent(new CustomEvent("item-selected", { detail: selection }));
      }
      element.classList.toggle("selected");
    });
    if (this.selection_store.has(id)) element.classList.add("selected");
  }
  _findWires(root) {
    const result = [];
    for (const child of root.children) {
      if (child.matches("artha-container") && child.hasAttribute("data-ignore-wire")) continue;
      if (child.hasAttribute("data-wire")) result.push(child);
      result.push(...this._findWires(child));
    }
    return result;
  }
  selection() {
    return this.selection_store;
  }
  reset() {
    this.selection_store.clear();
    for (const item of this.items) {
      item.classList.remove("selected");
    }
  }
};
var SelectionStore = class {
  constructor() {
    this.values = /* @__PURE__ */ new Set();
    this.elements = /* @__PURE__ */ new Map();
    this.data = /* @__PURE__ */ new Map();
  }
  add(value, element, data) {
    this.values.add(value);
    this.elements.set(value, element);
    this.data.set(value, data);
    return {
      value,
      element,
      data
    };
  }
  remove(value) {
    const sel = { value, element: this.elements.get(value), data: this.data.get(value) };
    this.values.delete(value);
    this.elements.delete(value);
    this.data.delete(value);
    return sel;
  }
  clear() {
    this.values.clear();
    this.elements.clear();
    this.data.clear();
    return this;
  }
  has(value) {
    return this.values.has(value);
  }
  toValues() {
    return Array.from(this.values);
  }
  toElements() {
    return Array.from(this.elements);
  }
  toData() {
    return Array.from(this.data);
  }
  toArray() {
    return Array.from(this.values).map((v) => ({
      value: v,
      element: this.elements.get(v),
      data: this.data.get(v)
    }));
  }
};

// src/components/artha-form.js
var ArthaForm = class _ArthaForm extends BaseComponent {
  static defaults = {
    response_type: "json"
  };
  constructor() {
    super([
      "action",
      "method",
      "response_type",
      "disable_submit"
    ], {
      booleans: ["disable_submit"],
      defaults: {
        "response_type": _ArthaForm.defaults.response_type
      },
      reflect: {
        response_type: false
      }
    });
    this.task_queue = TaskQueue.singleton();
    this.message = null;
    this.element_inputs = [];
    this.ignored_input = [];
    this._initialized = false;
    this._onSubmit = (evt) => {
      evt.preventDefault();
      if (!this.disable_submit) this.submit();
    };
    this._onKeyDown = (evt) => {
      if (this.disable_submit && evt.key === "Enter" && evt.target instanceof HTMLInputElement) {
        evt.preventDefault();
      }
    };
  }
  onConnected() {
    if (this._initialized) return;
    this.message = this.querySelector("artha-message") ?? this.querySelector(this.getAttribute("message-target")) ?? null;
    if (!this.message) {
      this.message = DOMHelper.createElement("artha-message");
      this.appendChild(this.message);
    }
    this.loadInputs();
    this.addEventListener("submit", this._onSubmit);
    this.addEventListener("keydown", this._onKeyDown);
    this._bindEvents();
    this._initialized = true;
  }
  onDisconnected() {
    this.removeEventListener("submit", this._onSubmit);
    this.removeEventListener("keydown", this._onKeyDown);
  }
  _bindEvents() {
    this.querySelectorAll("button").forEach((btn) => {
      switch (btn.getAttribute("type")) {
        case "submit":
          btn.addEventListener("click", (evt) => this.submit());
          break;
        case "reset":
          btn.addEventListener("click", (evt) => this.reset());
          break;
        default:
          btn.addEventListener("click", (evt) => this.submit());
      }
    });
    this.querySelector('[type="submit"]')?.addEventListener("click", (evt) => this.submit());
    this.querySelector('[type="reset"]')?.addEventListener("click", (evt) => this.reset());
  }
  // Cargar inputs dinámicos
  loadInputs(selector = "input,select,textarea") {
    this.element_inputs = [];
    this.querySelectorAll(selector).forEach((element) => {
      const name = element.getAttribute("name");
      if (name) {
        this[name] = element;
        this.element_inputs.push(element);
      }
    });
  }
  // Obtener valor de un input por el atributo name
  getValue(name) {
    const element = this[name] ?? this.querySelector(`[name="${name}"]`);
    return element ? element.type === "checkbox" ? element.checked ? 1 : 0 : element.value : null;
  }
  input(name) {
    const element = this.querySelector(`[name="${name}"]`);
    if (element != null && !(name in this)) {
      this[name] = element;
    }
    return element;
  }
  // Reset general del formulario
  reset(reset_message = true) {
    this.element_inputs.forEach((element) => {
      if (element.type === "checkbox") element.checked = false;
      else element.value = "";
    });
    if (reset_message) this.resetMessage();
  }
  // Reset al mensaje (ocultar)
  resetMessage() {
    if (this.message) this.message.hidden();
  }
  // Validar formulario
  checkValidity() {
    let valid = true;
    for (const element of this.element_inputs) {
      if (typeof element.checkValidity === "function" && !element.checkValidity()) {
        valid = false;
        break;
      }
    }
    return valid;
  }
  // Enviar formulario
  submit() {
    if (!this.checkValidity()) {
      this.message.warning("Formulario incompleto");
      return;
    }
    const form_data = {};
    this.element_inputs.forEach((element) => {
      form_data[element.name] = element.type === "checkbox" ? element.checked ? 1 : 0 : element.value;
    });
    const id = this.getAttribute("id");
    this.task_queue.loadTask(`form-${id}`, null, (task) => {
      XHR.request({
        url: this.action,
        method: this.method,
        data: form_data,
        response_type: this.response_type,
        onLoad: (xhr) => {
          this.dispatchEvent(new CustomEvent("load", { detail: xhr }));
        },
        onData: (xhr, json) => {
          task.resolve(xhr, () => {
            this.dispatchEvent(new CustomEvent("resolve", { detail: json }));
            this.fillFromJson(json.data ?? {}, false);
          });
        },
        onError: (err) => {
          this.message.error(err ?? "Error de conexi\xF3n");
          task.onFinalize();
        }
      });
    }, {
      message: this.message
    });
  }
  // Llenar inputs desde un JSON
  fillFromJson(json, reset = true) {
    if (reset) this.reset(false);
    for (const key in json) {
      const element = this.querySelector(`[name="${key}"]`);
      console.log(element);
      if (element) element.value = json[key];
    }
  }
};

// src/components/input-search.js
var InputSearch = class _InputSearch extends BaseComponent {
  static defaults = {
    delay: 300,
    text: "B\xFAscar",
    icon: "../dist/assets/icons/search.svg"
  };
  constructor() {
    super([
      "delay",
      "text",
      "value",
      "input",
      "button"
    ], {
      element_refs: ["input", "button"],
      resolvers: {
        "value": {
          set: (raw) => {
            return this.input.value = raw;
          },
          get: (raw) => {
            return this.input?.value ?? null;
          }
        }
      },
      defaults: {
        delay: _InputSearch.defaults.delay,
        text: _InputSearch.defaults.text
      },
      reflect: {
        text: false
      }
    });
    this._search_timer = null;
    this._initialized = false;
    this._onInput = ((evt) => {
      this._queueSearch();
    });
    this._onKeyDown = ((evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        this._cancelQueuedSearch();
        this.search();
      }
    });
    this._onClick = ((evt) => {
      evt.preventDefault();
      this._cancelQueuedSearch();
      this.search();
    });
  }
  onConnected() {
    if (this._initialized) return;
    this._ensureStructure();
    this._bindEvents();
    this._initialized = true;
  }
  onDisconnected() {
    this.input?.removeEventListener("input", this._onInput);
    this.input?.removeEventListener("keydown", this._onKeyDown);
    this.button?.removeEventListener("click", this._onClick);
    if (this._search_timer) {
      clearTimeout(this._search_timer);
      this._search_timer = null;
    }
    this._initialized = false;
  }
  _ensureStructure() {
    this.icon = _InputSearch.defaults.icon;
    this.style.display = "flex";
    this.input = this.appendChild(DOMHelper.createElement("input", (input) => {
      input.classList.add("input-field");
      input.type = "search";
      input.placeholder = this.text;
    }));
    this.button = this.appendChild(DOMHelper.createElement("button", (button) => {
      button.classList.add("button-search");
      button.appendChild(DOMHelper.createElement("span", (span) => {
        span.classList.add("icon", "search");
      }));
    }));
  }
  _bindEvents() {
    this.input.addEventListener("input", this._onInput);
    this.input.addEventListener("keydown", this._onKeyDown);
    this.button.addEventListener("click", this._onClick);
  }
  _queueSearch() {
    this._cancelQueuedSearch();
    this._search_timer = setTimeout(() => {
      this.search();
      this._search_timer = null;
    }, Number(this.delay));
  }
  _cancelQueuedSearch() {
    this.dispatchEvent(new CustomEvent("cancel-search", {
      detail: {
        query: this.value
      },
      bubbles: true
    }));
    if (this._search_timer) {
      clearTimeout(this._search_timer);
      this._search_timer = null;
    }
  }
  search() {
    this.dispatchEvent(new CustomEvent("search", {
      detail: {
        query: this.value
      },
      bubbles: true
    }));
  }
};

// src/index.js
Promise.resolve().then(() => {
  EventBus.emit("artha:before-register", {});
  registerComponents();
  EventBus.emit("artha:after-register", {});
});
function registerComponents() {
  if (!customElements.get("artha-container")) {
    customElements.define("artha-container", ArthaContainer);
  }
  if (!customElements.get("artha-form")) {
    customElements.define("artha-form", ArthaForm);
  }
  if (!customElements.get("artha-message")) {
    customElements.define("artha-message", ArthaMessage);
  }
  if (!customElements.get("artha-loader")) {
    customElements.define("artha-loader", ArthaLoader);
  }
  if (!customElements.get("input-search")) {
    customElements.define("input-search", InputSearch);
  }
}
export {
  ArthaContainer,
  ArthaForm,
  ArthaLoader,
  ArthaMessage,
  DOMHelper,
  DataHelper,
  EventBus,
  FormHelper,
  FormatHelper,
  InputSearch,
  NumberHelper,
  StringHelper,
  TaskQueue,
  XHR
};
//# sourceMappingURL=artha.js.map
