// Project Type
enum ProjectStatus {
    Active,
    Finished,
  }
  
  class Project {
    constructor(
      public id: string,
      public title: string,
      public status: ProjectStatus,
    ) {}
  }
  
  // Project State Management
  type Listener = (items: Project[]) => void;
  
  class ProjectState {
    private listeners: Listener[] = [];
    private projects: Project[] = [];
    private static instance: ProjectState;
  
    private constructor() {}
  
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new ProjectState();
      return this.instance;
    }
  
    addListener(listenerFn: Listener) {
      this.listeners.push(listenerFn);
    }
  
    addProject(title: string) {
      const newProject = new Project(
        Math.random().toString(),
        title,
        ProjectStatus.Active,
      );
      this.projects.push(newProject);
      for (const listenerFn of this.listeners) {
        listenerFn(this.projects.slice());
      }
    }
  }
  
  const projectState = ProjectState.getInstance();
  
  // Validation
  interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  }
  
  function validate(validatableInput: Validatable) {
    let isValid = true;
    if (validatableInput.required) {
      isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (
      validatableInput.minLength != null &&
      typeof validatableInput.value === 'string'
    ) {
      isValid =
        isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (
      validatableInput.maxLength != null &&
      typeof validatableInput.value === 'string'
    ) {
      isValid =
        isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (
      validatableInput.min != null &&
      typeof validatableInput.value === 'number'
    ) {
      isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (
      validatableInput.max != null &&
      typeof validatableInput.value === 'number'
    ) {
      isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
  }
  
  // autobind decorator
  function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      get() {
        const boundFn = originalMethod.bind(this);
        return boundFn;
      },
    };
    return adjDescriptor;
  }
  
  // ProjectList Class
  class TodoList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProjects: Project[];
  
    constructor(private type: 'active' | 'finished') {
      this.templateElement = document.getElementById(
        'project-list',
      )! as HTMLTemplateElement;
      this.hostElement = document.getElementById('app')! as HTMLDivElement;
      this.assignedProjects = [];
  
      const importedNode = document.importNode(
        this.templateElement.content,
        true,
      );
      this.element = importedNode.firstElementChild as HTMLElement;
      this.element.id = `${this.type}-projects`;
  
      projectState.addListener((projects: Project[]) => {
        const relevantProjects = projects.filter(prj => {
          if (this.type === 'active') {
            return prj.status === ProjectStatus.Active;
          }
          return prj.status === ProjectStatus.Finished;
        });
        this.assignedProjects = relevantProjects;
        this.renderProjects();
      });
  
      this.attach();
      this.renderContent();
    }
  
    private renderProjects() {
      const listEl = document.getElementById(
        `${this.type}-projects-list`,
      )! as HTMLUListElement;
      listEl.innerHTML = '';
      for (const prjItem of this.assignedProjects) {
        const listItem = document.createElement('li');
        listItem.textContent = prjItem.title;
        listEl.appendChild(listItem);
      }
    }
  
    private renderContent() {
      const listId = `${this.type}-projects-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent =
        this.type === 'active' ? '今日のTODO' : '完了したTODO';
    }
  
    private attach() {
      this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
  }
  
  // ProjectInput Class
  class TodoInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
  
    constructor() {
      this.templateElement = document.getElementById(
        'project-input',
      )! as HTMLTemplateElement;
      this.hostElement = document.getElementById('app')! as HTMLDivElement;
  
      const importedNode = document.importNode(
        this.templateElement.content,
        true,
      );
      this.element = importedNode.firstElementChild as HTMLFormElement;
      this.element.id = 'user-input';
  
      this.titleInputElement = this.element.querySelector(
        '#title',
      ) as HTMLInputElement;
  
      this.configure();
      this.attach();
    }
  
    private gatherUserInput(): [string] | void {
      const enteredTitle = this.titleInputElement.value;
  
      const titleValidatable: Validatable = {
        value: enteredTitle,
        required: true,
      };
      if (
        !validate(titleValidatable)
      ) {
        alert('入力値が正しくありません。再度お試しください。');
        return;
      } else {
        return [enteredTitle];
      }
    }
  
    private clearInputs() {
      this.titleInputElement.value = '';
    }
  
    @autobind
    private submitHandler(event: Event) {
      event.preventDefault();
      const userInput = this.gatherUserInput();
      if (Array.isArray(userInput)) {
        const [title] = userInput;
        projectState.addProject(title);
        this.clearInputs();
      }
    }
  
    private configure() {
      this.element.addEventListener('submit', this.submitHandler);
    }
  
    private attach() {
      this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
  }
  
  const prjInput = new TodoInput();
  const activePrjList = new TodoList('active');
  const finishedPrjList = new TodoList('finished');