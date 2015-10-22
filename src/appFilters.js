export function floorFilter ($window) {
    return function(n){
        return $window.Math.floor(n);
    };
};
