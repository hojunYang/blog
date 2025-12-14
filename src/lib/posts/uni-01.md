---
id: "uni-01"
title: "공학컴퓨터프로그래밍 기말고사"
excerpt: "공학컴퓨터프로그래밍 기말고사를 준비하며 정리한 자료"
date: "2025-12-09"
author: "양호준"
tags: ["University"]
---

## 9주차 

### Constructor Definition

Constructors defined like any member function, except:
- Must have same name as class
- Return type is not declared: cannot return a value, not even void
- Must declared in public section

**기본 생성자 예시:**

```cpp
DayOfYear::DayOfYear( int monthValue, int dayValue = 5) // default 값 세팅은 오른쪽부터 가능
{
    month = monthValue;
    day = dayValue;
}
```

**Initialization Section을 사용한 생성자:**

생성자는 Initialization Section을 사용하여 표현할 수 있습니다. const나 reference 변수도 이 섹션에서 할당할 수 있습니다.

```cpp
DayOfYear::DayOfYear( int monthValue, int dayValue )
: month(monthValue), day(dayValue) // Initialization Section
{
    // 함수 본문
    month = monthValue;
    day = dayValue;
}
```

**객체 생성 방법:**

```cpp
// Stack 메모리로 할당
DayOfYear date1(7, 4), date2(5, 5);
DayOfYear date1, date2;
date1 = DayOfYear(7, 4);

// Dynamic allocation (Heap 메모리로 할당)
DayOfYear* p_date1 = new DayOfYear(7, 4);
DayOfYear* p_date2 = new DayOfYear(5, 5);
```

### Private Constructor

Private Section에 생성자를 넣을 수 있습니다. 평범하진 않지만, 특정 유형의 생성자를 제한하기 위해 사용합니다.

```cpp
class DayOfYear
{
    public:
        DayOfYear(int, int) {}
        void output();

    private:
        // Private constructors는 호출할 수 없음
        DayOfYear(int, double) {}
        DayOfYear(double, int) {}
        DayOfYear(double, double) {}

    int month;
    int day;
};
// 실행 시 private constructor를 사용했다고 에러가 발생함
```

### Default Constructor 주의사항

**인자 없이 실행할 때 조심해야 할 점:**

```cpp
DayOfYear date1;         // ✅ OK!
DayOfYear date();        // ❌ NO! (함수 선언으로 인식됨)
date1 = DayOfYear();     // ✅ OK! (익명 인스턴스 생성)
```

**중요한 규칙:**
- Default Constructor는 아무 생성자도 없을 때 자동 생성됨
- 하나라도 생성자가 있으면 Default Constructor는 생성되지 않음
- 이 경우 initializer 없이 선언할 수 없음

```cpp
MyClass myObject; // ❌ 생성자가 정의되어 있으면 불가능
```

### Copy Constructor

Copy Constructor를 선언하지 않으면, Default copy constructor가 생성됨 (shallow copy임, string쪽에서 문제가 발생)

```cpp
class DayOfYear
{
    public:
        DayOfYear(const DayOfYear& other) // Copy constructor - 반드시 reference로 전달
        {
            this->month = other.month;
            this->day = other.day;
        }
};
```

```
error: copy constructor must pass its first argument by reference
   15 |   CPE(CPE p1)
1 error generated.
```

### Destructor

Dynamically-allocated variables는 delete가 필요함.

포인터가 멤버 변수라면 They are dynamically allocated with "real" data. Must have ways to "deallocate" when object is destroyed.

```cpp
class DayOfYear
{
public:
    ~DayOfYear()
    {
        // when necessary, deallocate pointers
        // do other clean-up
    }
};
```
### OTHER TOOLS IN CLASS & ARRAY DECAY

**Call-by-value**
- Requires copy be made → Overhead

**Call-by-reference**
- Placeholder for actual argument
- Most efficient method
- For class types → clear advantage
- Especially for "large" data, like class types

**const:** read-only

**Inline Member Function:** 선언이 함께된 함수  
If too long → actually less efficient! because All inline functions are include in binary.

**Array Decay:** When we pass array as pointer in function call, First address to the array is passed.
```cpp
void f1(int *arr){
    // array decay here
    // array information is lost
    // e.x size of array
    cout << sizeof(arr) << endl; // not 20, return 8

    for(int a : arr)
        std::cout << a << std::endl; // Compiler error: no viable 'begin' function available
}

int main(){
    int arr[5] = {1,2,3,4,5};
    f1(arr);
}
```

그래서 두 가지 방식으로 Array Decay를 피해야함:

```cpp
// 방법 1: 배열 크기를 별도 인자로 전달
void f1(int *arr, int num){
    for(int i=0; i<num; i++)
        cout << arr[i] << endl;
    // for(int a : *(int(*)[10])arr)  // array pointer로 변환
    // for(int& a : (int(&)[num])*arr) // array reference로 변환
}

// 방법 2: Reference로 받음
void f2(int (&arr)[5]){
    for(int a : arr)
        cout << a << endl;
}

int main(){
    int arr[5] = {1,2,3,4,5};
    f1(arr, 5);
    f2(arr);
}
```
## 10주차

### INHERITANCE

Inheritance is mainly about grouping common aspects.

- **Base class:** parent class or superclass
- **Derived class:** child class or subclass

```cpp
class HourlyEmployee : public Employee // ':' 를 사용해서 상속
{
}
```

C++ allows us to drop the const when redefining in the derived class.

명시적으로 함수를 호출함으로써 부모 Class의 멤버 함수에 접근할 수 있음:

```cpp
Employee JaneE;
HourlyEmployee SallyH;
JaneE.printCheck();              // Employee's printCheck
SallyH.printCheck();             // HourlyEmployee printCheck
SallyH.Employee::printCheck();   // Employee's printCheck (명시적 호출)
```

### Constructor in Inheritance

**중요 규칙:**
- Base class constructors are not inherited in derived classes
- But, they can be invoked within derived class constructor
- Initializing the base class members in initialization section is not allowed
- Should always invoke one of the base class's constructors
- If you do not, default base class constructor automatically called

```cpp
HourlyEmployee::HourlyEmployee(
    string theName,
    string theNumber,
    double theWageRate,
    double theHours
) 
    : Employee(theName, theNumber),    // Base class constructor 호출
      wageRate(theWageRate),
      hours(theHours)
{
    // deliberately empty
}
```

**Destructor:**  
When derived class destructor is invoked: Automatically calls base class destructor. Base class destructor handles inherited data automatically.

**Calling order:**
- ctor calling order: A → B → C
- dtor calling order: A ← B ← C

### Pitfall: Private Members in Base Class

Derived class cannot access directly members of base classes.  
→ This is possible with `protected` qualifier (in base class).

Using private is rare in real applications.

```cpp
class Person {
    // ...
private:
    string name;        // Derived class에서 접근 불가
// protected:
//    string name;      // 이렇게 하면 Derived class에서 접근 가능
};

class Student : public Person{
    // ...
    void printInfo();
    int sid;
};

void Student::printInfo(){
    // name은 private이므로 직접 접근 불가
    cout << "Name: 접근 불가" << endl;
    cout << "Student ID: " << sid << endl;
}
```

**상속 접근 지정자:**
- `public`으로 상속: Base의 모든 접근 지정자가 유지됨
- `protected`나 `private`로 상속: Base Class의 `public`이나 `protected`가 변경될 수 있음

### Functions Not Inherited

다음 함수들은 상속되지 않음:
- Constructors
- Destructors
- Copy constructor
- Assignment operator

**Copy Constructor Example:**

```cpp
B::B(const B& Object) : A(Object), …
{
    …
}
```

`A(Object)`는 자식 객체를 부모 객체가 받으므로 동작할 수 있다.

### Multiple Inheritance

Derived class can have more than one base class!

**BUT** Possibilities for ambiguity are endless!
- Dangerous undertaking!
- Some believe should never be used
- Certainly, should only be used by experienced programmers!
- So, it's not allowed in the successors of C++ (e.g., JAVA)


## 11주차

### VIRTUAL FUNCTION BASICS

Polymorphism과 Virtual Function은 Very important OOP principle!

**Polymorphism**
- Associating many meanings to one function
- Virtual functions provide this capability
- Fundamental principle of object-oriented programming!

Virtual functions을 사용하면 컴파일러에게 실제 프로그램에서 사용이 될 때까지 implement를 대기하라고 명령한다.

**Late Binding (Dynamic Binding):**  
Virtual functions implement late binding
**예시:**

```cpp
class Sale {
public:
    Sale();
    Sale(double thePrice);
    double getPrice() const;
    virtual double bill() const;  // Virtual function
    double savings() const;
private:
    double price;
};

double Sale::savings() const {
    return bill();  // Virtual function 호출
}

class Car : public Sale {
public:
    virtual double bill() const; 
    // Since bill was declared virtual in the base class,
    // it is automatically virtual in the derived class
    // even without "virtual" keyword.
    // But, it is recommended to add "virtual"
    // to explicitly indicate it's virtual for readability.
};

double Car::bill() const {
    return 100.35;
}

Sale a = new Car();
a.savings();  // Car의 bill()이 호출됨 (late binding)
```

이때 `a.savings()`를 통해 실행되는 `bill()`은 Car로부터 late binding한 `bill()`이다.

**중요한 차이:**
- Virtual functions changed: **overridden**
- Non-virtual functions changed: **redefined**

### override와 final Keyword

**override (C++11):**
- `virtual`로 Virtual Function을 명시적으로 표시하거나
- `override`를 통해 더 명확하게 표시

**final:**
- Subclass에서 더 이상 override 못하게 명시할 수 있음

### Virtual Functions의 단점

**One major disadvantage: overhead!**

- Uses more storage (typically, by a size of a single pointer)
- Internally, an additional pointer to **VTABLE (virtual function table)** is stored implicitly
- VTABLE stores the data for virtual functions
- Late binding is "on the fly", so programs run slower

**결론:**  
If virtual functions not needed, should not be used.

### Pure Virtual Functions

Superclass에서 virtual function에 대한 정의가 필요없을 때 `= 0`을 사용할 수 있습니다.

```cpp
class Pet
{
  public:
    string name;
    virtual void print() const = 0;  // Pure virtual function
};

int main()
{
  Pet pet;  // ❌ 컴파일 에러!
  return 0;
}
```

**컴파일 에러:**
```
error: variable type 'Pet' is an abstract class
note: unimplemented pure virtual method 'print' in 'Pet'
    virtual void print() const = 0;
```

**Abstract Base Classes:**
- Pure virtual function이 한 개 이상 존재하는 class
- Object를 생성할 수 없음 (모든 멤버 함수에 대해 완전한 정의가 없기 때문)

### Extended Type Compatibility

Derived is derived class of Base. We do not know how to assign the members of Derived from Base.

```cpp
class Pet {
public:
    string name;
    virtual void print() const;
};

class Dog : public Pet {
public:
    string breed;
    virtual void print() const;
};

Dog vdog;
Pet vpet;
vdog.name = "Tiny";
vdog.breed = "Great Dane";
vpet = vdog;  // OK! 자식 → 부모 할당 가능
```

**중요 규칙:**
- Can assign values to parent-types, but not reverse
- 이 상태에서 `vpet.breed`는 존재하지 않음

**Slicing Problem:**  
자식 클래스의 추가 멤버가 "잘려나가는" 문제. 이를 해결하기 위해 virtual member function을 사용할 수 있다.

### Virtual Destructors

```cpp
Base *pBase = new Derived;
// ...
delete pBase;  // Derived의 destructor가 호출되려면?
```

**해결책:**  
Destructor를 virtual로 선언하면 된다.

```cpp
class Base {
public:
    virtual ~Base() {}  // Virtual destructor
};
```

**Best Practice:**  
Good policy for all destructors to be virtual.

### Upcasting and Downcasting

```cpp
Pet vpet;
Dog vdog;

vdog = static_cast<Dog>(vpet);     // ❌ ILLEGAL! (Downcasting)
vpet = vdog;                        // ✅ Legal! (Upcasting)
vpet = static_cast<Pet>(vdog);     // ✅ Also legal!
```

**규칙:**
- **Upcasting (자식 → 부모):** 가능
- **Downcasting (부모 → 자식):** 허용되지 않음

### Downcasting with dynamic_cast

Downcasting dangerous! 그러나 `dynamic_cast`를 통해 가능은 하다.

**주의사항:**  
Downcasting rarely done due to pitfalls:
- Must track all information to be added
- All member functions must be virtual

## UML

### What is Modeling?

Modeling is process of abstraction of a real-world system.

**Why Modeling Software?**  
Software is getting more complex. Need simpler representations of complex systems.

### UML (Unified Modeling Language)

- Standard for modeling object-oriented software
- Collection of graphical notation
- Method to visualize the system

**Advantage of UML:**
- Help specifying, visualizing, documenting software
- Enhance communication between people
- Able to capture the logical software architecture

**Architecture:**  
Requirement → Design → Implementation → Verification → Deployment → Maintenance

### UML Diagrams

**Behaviour Diagram:**  
Activity, Use Case, Sequence, Communication, Interaction, State Machine

**Structure Diagram:**  
Class, Component, Package, Deployment, Object

### Diagram Types

**Use case diagram**
- Describe functional behavior of the system
- In user's perspective

**Class diagram**
- Describe the static structure of the system

**Sequence diagram**
- Describe the dynamic behavior between actors and the system

**Activity diagram**
- Describe the dynamic behaviors of the system

### Use Case Diagram Details

**Requirements:**
- **Functional requirements:** e.g., register user, send email, display picture
- **Non-functional requirements:** e.g., security (must use AES encryption), performance (must be done within 3 seconds)
- High level view of what system does

**Key Components:**
- **Actor:** models an external entity which interacts with the system
- **Use Case:** represents a class of functionality provided by the system
- **System boundary:** represents the scope of the system

### Use Case Diagram Relationship

**Types of relationship:**

1. **Association relationship**
   - Represents interaction between actors and use cases
   - Using a line to connect the actor and the use case

2. **Include relationship**
   - Represents a use case includes the functionality of another use case
   - Using a dashed arrow to indicate including and included use case

3. **Extend relationship**
   - Represents optional or exceptional cases
   - Using a dashed arrow and "extend" keyword

4. **Generalization relationship**
   - Represents one use case is a specialized version of another
   - Arrow pointing from specialized one to general one

