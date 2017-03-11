export function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

export function toDeg(rad) {
    return rad * 180 / Math.PI;
}

export function toRad(val) {
    return val * Math.PI / 180;
}

export const degToCompass = (num) => {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr=["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return arr[(val % 16)]
}