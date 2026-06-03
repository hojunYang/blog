---
id: "university-01"
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

**Call-by-value:**
- Requires copy be made → Overhead

**Call-by-reference:**
- Placeholder for actual argument
- Most efficient method
- For class types → clear advantage
- Especially for "large" data, like class types

**const:** read-only

**Inline Member Function:**

선언이 함께된 함수  
If too long → actually less efficient! because All inline functions are include in binary.

**Array Decay:**

When we pass array as pointer in function call, First address to the array is passed.

```cpp
void f1(int *arr) {
    // array decay here
    // array information is lost
    // e.x size of array
    cout << sizeof(arr) << endl; // not 20, return 8

    for(int a : arr)
        std::cout << a << std::endl; // ❌ Compiler error: no viable 'begin' function available
}

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    f1(arr);
}
```

그래서 두 가지 방식으로 **Array Decay를 피해야함**:

```cpp
// 방법 1: 배열 크기를 별도 인자로 전달
void f1(int *arr, int num) {
    for(int i = 0; i < num; i++)
        cout << arr[i] << endl;
    // for(int a : *(int(*)[10])arr)  // array pointer로 변환
    // for(int& a : (int(&)[num])*arr) // array reference로 변환
}

// 방법 2: Reference로 받음
void f2(int (&arr)[5]) {
    for(int a : arr)
        cout << a << endl;
}

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
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

C++ allows us to drop the `const` when redefining in the derived class.

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

Polymorphism과 Virtual Function은 **Very important OOP principle!**

**Polymorphism:**
- Associating many meanings to one function
- Virtual functions provide this capability
- Fundamental principle of object-oriented programming!

Virtual functions을 사용하면 컴파일러에게 실제 프로그램에서 사용이 될 때까지 implement를 대기하라고 명령한다.

**Late Binding (Dynamic Binding):**  

Virtual functions implement late binding.

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

## 12주차
### Operator Overloading

**Operator Overloading Introduction:**

Operators `+`, `-`, `%`, `==`, etc 는 **function**이다.  
`x + 7`이나 `y - 7` 같은 표현식은 사람에게 맞춰진 것이다.  
따라서 Function-like notation: `+(x,7)` 와 같이 작성할 수 있다.

**Operator Overloading Perspective:**

Built-in operators: `+`, `-`, `=`, `%`, `==`, `/`, `*`, ...  
우리는 이러한 operator function을 **overload** 할 수 있다.

```cpp
class Money {
public:
    getDollars();
    getCents();
private:
    int dollars;
    int cents;
    …
};

// Global operator overloading
const Money operator+(const Money& amount1, const Money& amount2);
```

위 코드는 **global**한 overloaded를 한 것이다.  
효율을 위해 **constant reference**를 사용하는 것이 좋다.

```cpp
// bool 형태를 통해 operator==에 대해서도 overload 가능
bool operator==(const Money& amount1, const Money& amount2);
```

**Constructors Returning Objects:**

Constructor는 void function이 아니다. 그 이유는 constructor은 object(class의 호출)를 반환하기 때문이다.  
Remind the "**anonymous object**".

```cpp
cout << 1 + 2 << endl; // 3 is placed in an anonymous object
```

**const 활용에 대하여:**

- **매개변수의 const**: operand를 변경하면 안되는 연산이기 때문에 붙인다. const 객체도 operand로 받을 수 있다.
- **반환 타입의 const**: 반환된 임시 객체를 수정하지 못하게 하려는 의도
  - `(m1 + m2).input()` (e.g. `= m3`)을 통해 수정이 이뤄진다면 이름도 없는 임시 객체가 수정되는 것
  - 그러나 `m1 + m2`는 rvalue(임시객체)이기 때문에 non-const 멤버 함수가 rvalue에 바인딩할 수 없다

**Overloading Unary Operators:**

Unary Operator로는 `-`, `++`, `--`가 있다.  
Unary operator는 only one argument (since only 1 operand).  
`-`에 대해서는 두 번의 overload가 필요하다:
- Two operand의 경우 (binary)
- One operand의 경우 (unary)

### OVERLOADING AS MEMBER FUNCTIONS

**중요:**  
Only **ONE parameter**, not two!  
Calling object가 첫 번째 매개변수 역할을 한다. `*this`가 first parameter로 implicitly 전달됨.

```cpp
Money cost(1, 50), tax(0, 15), total;
total = cost + tax;
// Actually: total = cost.operator+(tax)

// Declaration
const Money::operator+(const Money& amount);
```

**장점:**
- Member operators가 더 효율적: accessor & mutator functions 호출 불필요
- OOP 원칙은 member operators를 권장

**Overloading Function Application `()`:**

```cpp
Aclass anObject;
anObject(42);
// If () overloaded! calls overload
```

### Pitfall: 특정 연산자 Overloading 주의사항

`&&`, `||`, and **comma operator**은 overload가 가능하지만, overload를 하게 되면 **short-circuit의 특성을 잃는다**.

왜냐하면 overload를 위해 변수의 타입을 정하기 위해 모든 인자를 평가해야하기 때문에, 평가에 대한 이점이 사라진다.
comma operator은 어떻게 써도 성능에 영향을 주지 않는다.

**결론:**  
이런 연산자들은 일반적으로 overload하지 않는 것이 좋다.

### Overloading `<<` and `>>`

`<<`, `>>` operator는 overload하는게 **가독성을 증진**할 수 있다.

**`<<` 연산자 overloading 특징:**
- 1st operand는 predefined object `cout`
- 이것이 `operator<<`가 class의 **member function이 아닌 이유**
- 2nd operand는 literal string

```cpp
Money amount(100);
cout << "I have " << amount;
(cout << "I have ") << amount;
// 두 가지 모두 같은 결과
```

`<<` operator는 a reference to `cout` object를 return한다.

**구현 예제:**

```cpp
// Friend function 선언
friend ostream& operator<<(ostream& outputStream, const Money& amount);
friend istream& operator>>(istream& inputStream, Money& amount);

// << 연산자 구현
ostream& operator<<(ostream& outputStream, const Money& amount)
{
    int absDollars = abs(amount.dollars);
    int absCents = abs(amount.cents);

    outputStream << absDollars;
    outputStream << absCents;
    return outputStream;  // 체이닝을 위해 반환
}

// >> 연산자 구현
istream& operator>>(istream& inputStream, Money& amount)
{
    char dollarSign;
    inputStream >> dollarSign;  // hopefully
    double amountAsDouble;
    inputStream >> amountAsDouble;
    amount.dollars = amount.dollarsPart(amountAsDouble);
    amount.cents = amount.centsPart(amountAsDouble);
    return inputStream;  // 체이닝을 위해 반환
}
```

이처럼 Returns its first argument type: `ostream&` & `istream&`

### Assignment Operator `=`

**중요 규칙:**

Must be overloaded as **member operator**.  
그 이유는 왼쪽 피연산자가 반드시 자기 자신(`*this`)이어야 하기 때문이다.

**Simultaneously with copy constructor:**  
복사 생성자와 대입 연산자는 **쌍**이다. 하나를 정의하면 다른 하나도 같이 고려해야 한다.  
왜냐하면 한 쪽이 Deep copy로 정의해도 다른 쪽은 Shallow copy가 될 수 있기 때문.

**기본 대입 연산자:**
- 자동으로 제공되며, **Shallow copy** 발생
- 한 object의 멤버 변수가 다른 object의 동일한 멤버 변수로 그대로 복사됨
- 단순한 class에서는 기본 대입 연산자로도 충분
- **포인터가 있다면** 새로운 메모리를 할당하고 내용을 복사하는 **Deep copy** 구현 필요

**Deep Copy 구현 예제:**

```cpp
class String {
    char* data;
public:
    // 1. 생성자
    String(const char* s = "") {
        data = new char[strlen(s) + 1];
        strcpy(data, s);
    }

    // 2. 복사 생성자 (deep copy)
    String(const String& other) {
        data = new char[strlen(other.data) + 1];
        strcpy(data, other.data);
    }

    // 3. 대입 연산자 (deep copy)
    String& operator=(const String& rhs) {
        if (this == &rhs) return *this;  // 자기 자신과의 대입 방지

        delete[] data;  // 기존 메모리 해제
        data = new char[strlen(rhs.data) + 1];  // 새 메모리 할당
        strcpy(data, rhs.data);  // 데이터 복사

        return *this;  // 체이닝을 위해 반환
    }

    // 4. 소멸자
    ~String() {
        delete[] data;
    }
};
```

**Rule of Three:**  
소멸자, 복사 생성자, 대입 연산자 중 하나를 정의하면 셋 다 정의해야 한다!

### Increment and Decrement Operator

**두 가지 버전:**

Each operator has two versions:
- **Prefix notation**: `++x`
- **Postfix notation**: `x++`

이를 구별하기 위해 다른 문법으로 구현한다.

**구현 예제:**

```cpp
class Counter {
    int value;
public:
    // Prefix: ++x
    Counter& operator++() {
        ++value;
        return *this;  // 증가된 값 반환
    }

    // Postfix: x++ (dummy int parameter)
    Counter operator++(int) {
        Counter temp = *this;  // 이전 값 저장
        ++value;               // 값 증가
        return temp;           // 이전 값 반환
    }
};
```

**핵심 차이점:**
- **Prefix** (`++x`): 증가 후 자기 자신을 반환 → `Counter&`
- **Postfix** (`x++`): 증가 전 복사본을 반환 → `Counter`

`(int)` 매개변수는 아무런 의미가 없는 **더미 코드**로, 단지 prefix와 구별하기 위한 문법적 장치다.

### Friend Functions

**Friend Functions의 필요성:**

함수를 비멤버로 만들면:
- ❌ 캡슐화를 지키는 대신 getter/setter를 남발
- ❌ 성능, 가독성 모두 나빠짐

**Friend Functions의 장점:**
- ✅ private class data에 직접 접근 가능
- ✅ No overhead, more efficient

**Friend 선언 방법:**

`friend` 키워드를 function declaration 앞에 사용.  
Class definition 안에 명시. **But they're NOT member functions!**

```cpp
class A {
  private:
    int num;
  public:
    A(): num(10) {}
    friend void printNum(A);  // friend 선언
};

// ✅ 올바른 구현 (A::를 붙이지 않음)
void printNum(A a) {
  cout << "num: " << a.num << endl;  // private 멤버 직접 접근 가능
}

// ❌ 잘못된 구현
void A::printNum(A a) {  // Friend는 member가 아니므로 A:: 불가
  cout << "num: " << a.num << endl;
}
// 에러: out-of-line definition of 'printNum' does not match any declaration in 'A'
```

**Friend Function Uses:**

Operator Overloads (가장 일반적인 사용):
- Most common use of friends
- Improves efficiency
- Avoids need to call accessor/mutator member functions

**장점 (Advantageous):**
- Still encapsulates: friend는 class definition 안에 선언됨
- Improves efficiency
- Allows automatic type conversion

```cpp
// automatic type conversion 예제
Money baseAmount(100, 60), fullAmount;
fullAmount = baseAmount + 25;  // ✅ legal (암시적 형변환)
fullAmount = 25 + baseAmount;  // ❌ illegal (member function이면 불가)
```

Friend function으로 `operator+`를 구현하면 양방향 형변환이 모두 가능!

### Friend Classes

Entire classes can be friends. Similar to function being friend to class.
`friend class F` 형식을 통해 선언할 수 있고, **NOT reciprocated**다.

```cpp
class C {
    friend class F; // F는 C의 모든 멤버에 접근가능하지만, 반대는 아님
};
```

**Overload Array Operator `[]`:**

`operator[]`도 overload가 가능하다.  
Operator must return a **reference**! 꼭 **member function**이어야 한다.

## 13주차
### Function Templates

Overloading swap function을 만든다고 가정하면, 각각 다른 type으로 구현해야한다.  
이를 **Function Template**으로 해결할 수 있다.

```cpp
template<class T> // template prefix, class는 type이라는 뜻이고, typename으로 바꿔서 쓸 수 있다
void swapValues(T& var1, T& var2)
{
    T temp = var1;
    var1 = var2;
    var2 = temp;
}
```

`T` can be replaced by any type. can use other than "T", but T is "traditional" usage.

### MORE ABOUT TEMPLATES

**Multiple Type Parameters:**

```cpp
template<class T1, class T2>
```

템플릿에서는 보통 하나의 치환 가능한 타입만 필요하며, 사용되지 않는 템플릿 매개변수는 허용되지 않는다.  
각 템플릿 매개변수는 반드시 정의에서 사용되어야 하며, 그렇지 않으면 컴파일러가 타입을 추론하지 못해 함수 코드를 생성할 수 없고, 그 결과 함수 호출 시 적절한 정의를 찾지 못해 오류가 발생한다.

**Inappropriate Types in Templates:**

Cannot use type for which assignment operator isn't defined.  
e.g. an array (not `std::array`)

Array를 쓰기 위해선:

```cpp
// void foo(int a[3])
// {
//     for(auto &i : a) ERROR! No begin() with pointer type
//     cout << &i << endl;
// }

template<class T, int N>
void foo(T (&a)[N])
{
    for(auto &i : a)
        cout << &i << endl;
}
```

### Class Templates

Once template defined, can declare objects of the class.

```cpp
template<class T>
class Pair
{
public:
    Pair();
    Pair(T firstVal, T secondVal);
    void setFirst(T newVal);
    void setSecond(T newVal);
    T getFirst() const;
    T getSecond() const;
private:
    T first;
    T second;
};

template<class T>
Pair<T>::Pair(T firstVal, T secondVal)
{
    first = firstVal;
    second = secondVal;
}

template<class T>
void Pair<T>::setFirst(T newVal)
{
    first = newVal;
}
```

위 코드처럼 Class도 template를 사용해서 선언할 수 있다.  
Each definition, Requires **template prefix** before each definition. Class name before `::` is `Pair<T>`

**Object 선언 예제:**

```cpp
Pair<int> score;
Pair<char> seats;
score.setFirst(3);
score.setSecond(0);
```

**Function Template with Class Template:**

```cpp
template<class T>
T addUp(const Pair<T>& thePair);
// precondition: Operator + is defined for values of type T
// returns sum of two values in thePair
```

**Restrictions on Type Parameter:**
- Assignment operator must be "well-behaved"
- Copy constructor must also work
- If T involves pointers, then destructor must be suitable!

**Templates and Inheritance:**

Derived template classes. Can derive from template or non-template class.

```cpp
template <class T>
class Parent {
    T val;
public:
    Parent(T arg1) { val = arg1; }
    void print() { cout << val << endl; }
};

class Child : public Parent<int> {
public:
    Child(int a) : Parent<int>(a) {}
};

template <class Z>
class Child : public Parent<Z> {
public:
    Child(Z a) : Parent<Z>(a) {}
};
```

**Type Definitions: `typedef` or `using`:**

They represent specialized class template name.

```cpp
template <class T>
using PairOfNums = Pair<T>;
typedef Pair<int> PairOfInt;

PairOfInt pair1, pair2;
PairOfNums<float> fpair1;
```

`using`은 `typedef`의 상위호환이며, 템플릿에 대한 정의가 가능하다.

## 14주차

### Introduction to Vectors

**Limitation of C-Arrays:**
- The size of static array is fixed, and should be known at compile time
- Dynamic array needs `malloc`/`free`/`new`/`delete`, which needs to be handled with care

**STL Vectors:**

STL Vectors are arrays that automatically grow and shrink. We do not care about the memory allocation/deallocation.

```cpp
std::vector<Base_Type> // Template STL Class
std::vector<int> v;
```

**주요 특징:**
- **Indexing**: indexed like arrays for access (e.g., `v[0]`, `v[1]`, `v[k]`, ...)
  - 값을 입력하기 전까진 index방식으로 접근할 수 없음
- **Adding elements**: `push_back()`
- **Querying the count of elements**: `size()`

**Vector Efficiency:**

Member function `capacity()`:
- Returns memory currently allocated
- Not same as `size()`
- Typically, `capacity >= size`
- Automatically increased as needed
- In practice, when capacity is not enough, the capacity is doubled

효율성이 중요한 경우, `v.reserve()`를 통해 미리 세팅할 수 있다.

`push_back` 반복 시:
- capacity 부족 → 재할당
- 메모리 복사 발생
- 성능 저하

```cpp
v.reserve(32);          // pre-set capacity to 32
v.reserve(v.size()+10); // allocates 10 more elements
```

### STANDARD TEMPLATE LIBRARY

- Set of C++ template classes
- Software library for C++, having all such data structures
- Code quickly, efficiency, generic programming

**Main components:**
- **Container**: Stores objects or data of arbitrary types
- **Iterator**: Step through elements in containers
- **Algorithm**: Performs particular tasks using iterator (Sort, search)
- **Adaptors**: Wrapping common container to implement data structures (stack, queue, priority_queue)

**Standard Containers in STL:**

**Sequence containers** (ordered collections):
- `vector`: dynamic array
- `list`: doubly linked list
- `deque`: double-ended queue (adapted to stack and queue)

**Associative containers** (unordered collections):
- `set`, `multiset`
- `map`: dictionary (internally ordered by balanced binary tree)
- `multimap`: similar to map, but with duplicate keys
- `unordered_map`: dictionary with hash

### ITERATORS

Generalization of a pointer to STL containers/adaptors.
- Typically even implemented with pointer!

**"Abstraction" of iterators:**
- Designed to hide details of implementation
- Provide consistent interface across different container classes

**Each container class has "own" iterator type:**
- Similar to how each data type has own pointer type

**Manipulating Iterators:**

Recall using overloaded operators:
- `++`, `--`, `==`, `!=`, `*`
- So if `p` is an iterator variable, `*p` gives access to data pointed to by `p`

```cpp
// return iterator for the first item in c
std::vector<int>::iterator it = c.begin();
// return iterator for after-last item in c
// e.g., for size-2 vector, end() indicates index 2
auto it2 = c.end();
```

**Cycling with Iterators:**

Recall cycling ability:

```cpp
for(auto p = c.begin(); p != c.end(); p++)
    process(*p); // *p is current data item
// Powerful usage of auto!
```

**Vector Iterator Types:**

```cpp
std::vector<int>::iterator
std::list<int>::iterator
```

**Iterator Classifications:**

**Forward iterators** (`forward_list`, `unordered_map`, `unordered_set`):
- `++` works on iterator

**Bidirectional iterators** (`list`, `set`, `map`, `multiset`, `multimap`):
- Both `++` and `--` work on iterator

**Random-access iterators** (`vector`, `deque`, `array`):
- `++`, `--`, and random access all work with iterator

**Constant and Mutable Iterators:**

Dereferencing operator's behavior dictates.

**Constant iterator:**
- `*` produces read-only version of element
- Can use `*p` to assign to variable or output, but cannot change element in container

```cpp
std::vector<int> v = {1, 2, 3}; // or 컨테이너가 const이면, iterator도 반드시 const
std::vector<int>::const_iterator p = v.begin();

int x = *p;       // ✅ 읽기 가능
std::cout << *p;  // ✅ 출력 가능
*p = 5;           // ❌ 불가
```

**Mutable iterator:**
- `*p` can be assigned value
- Changes corresponding element in container
- i.e.: `*p` returns an lvalue

```cpp
std::vector<int> v = {1, 2, 3};
std::vector<int>::iterator p = v.begin();

*p = 10;   // ✅ v[0]이 10으로 바뀜
```

**Reverse Iterators:**

To cycle elements in reverse order:

```cpp
for(auto p = container.end(); p != container.begin(); p--) // end() is just "sentinel"!
    cout << *p << " ";

for(vector<int>::reverse_iterator rp = c.rbegin(); rp != c.rend(); rp++)
    cout << *rp << " ";
```

### CONTAINERS

**Container classes in STL:**
- Different kinds of data structures
- Linked lists, queues, stacks

**Arranges list data:**
- 1st element, next element, … to last element
- Vector is a container class

**Sequential Containers:**

Linked list is sequential container:
- Linear collection of data elements
- Each element points to the next element

STL has no "singly linked list". Only "doubly linked list": template class `list`

```cpp
list<int>::iterator iter;
for (iter = listObject.begin(); iter != listObject.end(); iter++)
    cout << *iter << " ";

cout << iter[2] << endl; // ❌ 불가능! 컴파일 에러. linked list는 random access가 아니기 때문
```

**Associative Containers:**
- Simple database or dictionary
- Store data with key: each data item has key

**Set Template Class:**

- Simplest container possible
- Stores elements without repetition: 1st insertion places element in set
- Each element is own key
- Designed to be efficient: Stores values in sorted order

```cpp
// Can specify order: set<T, Ordering> s;
set<int, greater<int>>, set<int, CustomOrder> // Ordering is well-behaved ordering relation that returns bool

cout << "The set contains:\n";
set<char>::const_iterator p;
for (p = s.begin(); p != s.end(); p++)
    cout << *p << " ";
cout << endl;

cout << "Set contains 'C': ";
if (s.find('C') == s.end())
    cout << " no " << endl;
else
    cout << " yes " << endl;

cout << "Removing C.\n";
s.erase('C');
```

**Map Template Class:**

A function given as set of ordered pairs:
- For each value `first`, at most one value `second` in map considering `(first, second)` pair

Can use `[]` notation to access the map:
- For both storage and retrieval

Stores in sorted order, like set.

```cpp
map<string, string> planets;
planets["Mercury"] = "Hot planet";
planets["Venus"] = "Atmosphere of sulfuric acid";
planets["Earth"] = "Home";
planets["Mars"] = "The Red Planet";
planets["Jupiter"] = "Largest planet in our solar system";

if (planets.find("Mercury") != planets.end())
    cout << "Mercury is in the map." << endl;

if (planets.find("Ceres") == planets.end())
    cout << "Ceres is not in the map." << endl << endl;
```

## 15주차

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

**Use case diagram:**
- Describe functional behavior of the system
- In user's perspective

**Class diagram:**
- Describe the static structure of the system

**Sequence diagram:**
- Describe the dynamic behavior between actors and the system

**Activity diagram:**
- Describe the dynamic behaviors of the system
