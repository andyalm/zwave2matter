export type PropertyChangedCallback<TValue> = (newValue: TValue) => void;
export type PropertyValueSetter<TValue> = (propertyName: string, value: TValue) => void;
export type PropertyChangeSubscribable<TValue> = (propertyName: string, callback: (newValue: TValue) => void) => void;

export class ZwavePropertyManager<TValue> {
  readonly #targetPropertyName: string;
  #currentValue: TValue;
  #targetValue: TValue | undefined;
  readonly #valueSetter: PropertyValueSetter<TValue>;
  readonly #propertyChangeHandlers: PropertyChangedCallback<TValue>[] = [];

  #lastSetAttempt: Date;

  constructor(currentPropertyName: string,
              targetPropertyName: string,
              currentValue: TValue,
              valueSetter: PropertyValueSetter<TValue>,
              propertyChangeSubscribable: PropertyChangeSubscribable<TValue>) {
    this.#targetPropertyName = targetPropertyName;
    this.#currentValue = currentValue;
    this.#valueSetter = valueSetter;
    propertyChangeSubscribable(currentPropertyName, newValue => {
      this.#currentValue = newValue;
      for(const handler of this.#propertyChangeHandlers) {
        handler(newValue);
      }
    });
    this.#lastSetAttempt = new Date(0);
  }

  addChangeListener(callback: PropertyChangedCallback<TValue>) {
    this.#propertyChangeHandlers.push(callback);
  }

  setValue(targetValue: TValue) {
    const thisAttempt = new Date();
    if (thisAttempt.getTime() - this.#lastSetAttempt.getTime() > 1000) {
      this.#lastSetAttempt = thisAttempt;
      this.#targetValue = targetValue;
      this.#valueSetter(this.#targetPropertyName, targetValue);
    }
    else {
      this.#lastSetAttempt = thisAttempt;
      this.#targetValue = targetValue;
      setTimeout(() => {
        if(new Date().getTime() - this.#lastSetAttempt.getTime() > 1000 && this.#targetValue) {
          this.#valueSetter(this.#targetPropertyName, this.#targetValue);
          this.#targetValue = undefined;
        }
      }, 1000);
    }
  }
}
