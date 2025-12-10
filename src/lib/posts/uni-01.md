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

```cpp
DayOfYear::DayOfYear( int monthValue, int dayValue = 5) //default 값 세팅은 오른쪽부터 가능함.
{
    month = monthValue;
    day = dayValue;
}
```

생성자는 이렇게도 표현할 수 있음. const나 reference 변수도 Initialization Section에서는 할당할 수 있음.

```cpp
DayOfYear::DayOfYear( int monthValue, int dayValue )
: month(monthValue), day(dayValue) //2rd
{ // 3rd
    month = monthValue
    day = dayValue 
}
```
```cpp
DayOfYear date1(7, 4), date2(5, 5); // stack 메모리로 할당됨.
DayOfYear date1, date2
date1 = DayOfYear(7, 4);

// 이런식으로 Dynamic allocation도 가능함. heap 메모리로 할당됨.
DayOfYear* p_date1 = new DayOfYear(7, 4);
DayOfYear* p_date2 = new DayOfYear(5, 5);
```

평범하진 않지만, Private Section에 Constructor를 넣을 수 있음. 그러나 실행할 순 없음. 특정 유형의 생성자를 제한하기 위해 사용함.
```cpp
class DayOfYear
{
    public:
        DayOfYear(int, int) {}
        void output();

    private:
        // We cannot call private constructors
        DayOfYear(int, double) {}
        DayOfYear(double, int) {}
        DayOfYear(double, double) {}

    int month;
    int day;
};
실행시 private constructor를 사용했다고 에러가 난다.
```

No Argument로 실행할 땐 조심해야함. 
```cpp
DayOfYear date1; // Yes!
DayOfYear date(); // NO!
date1 = DayOfYear(); // Yes! creates an anonymous instance -> TODO: new 로 하는게 메모리에 더 좋나?
```
Default Constructor은 아무것도 없을때 auto-gernerated 되고, any Constructor이 있을땐 생성되지 않음.
그러니 그럴땐 아래처럼 initializer없이 선언할 수 없음.
```cpp
MyClass myObject; // NO!
```

Copy Constructor은 선언하지 않으면, Default copy constructor가 생성됨(shallow copy임, string쪽에서 문제가 발생, 숫자는 anymous instance로 할당되는듯)
```cpp
class DayOfYear
{
    public:
        DayOfYear(const DayOfYear& other) //copy 할 수 있음.
        {
            this->month = other.month;
            this->day = other.day;
        }
};
error: copy constructor must pass its first argument by reference
   15 |   CPE(CPE p1)
1 error generated.
```

Dynamically-allocated variables는 delete가 필요함.
포인터가 멤버 변수라면 They are dynamically allocated with "real" data.
Must have ways to "deallocate" when object is destroyed.

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
Call-by-value
- Requires copy be made -> Overhead
Call-by-reference
- Placeholder for actual argument
- Most efficient method
- For class types -> clear advantage
- Especially for "large" data, like class types

const: read-only
Inline Member Function: 선언이 함께된 함수
If too long -> actually less efficient! because All inline functions are include in binary.

Array Decay: When we pass array as pointer in function call, First address to the array is passed.
```cpp
void f1(int *arr){
    // array decay here
    // array information is lost
    // e.x size of array
    cout << sizeof(arr) << endl; //-> not 20, return 8;

    for(int a : arr)
        std::cout << a << std::endl; //Compiler error : no viable 'begin' function available.
}
int main(){
    int arr[5] = {1,2,3,4,5};
    f1(arr);
}
```
그래서 두 가지 방식으로 Array Decay를 피해야함
```cpp
void f1(int *arr, int num){ //숫자를 따로 사용함.
    for(int i=0; i<num; i++)
        cout << arr[i] << endl;
    }
    // for(int a : *(int(*)[10])arr) -> 가능함. array pointer로 바꾸거나 array reference로 바꾸면됨.
    // for(int& a : (int(&)[num])*arr) //이렇게도 가능함.

void f2(int (&arr)[5]){ //Reference로 받음.
    for(int a : arr)
        cout << a << endl;
    }
int main(){
    int arr[5] = {1,2,3,4,5};
    f1(arr,5);
    f2(arr);
}
OTHER TOOLS IN CLASS & ARRAY DECAY
```


## UML
Modeling is Process of abstraction of a real-world system.
Why Modeling Software?
Software is getting more complex. Need simpler representations of complex systems.

UML(Unified Modeling Language)
- Standard for modeling object-oriented software.
- Collection of graphical notation.
- Method to visualize the system.

Advantage of UML
- Help specifying, visualizing, documenting software.
- Enhance communication between people.
- Able to capture the logical software architectur.

Architecture
- Requirement -> Design -> Implementation -> Verification -> Deployment -> Maintenance.

UML Diagrams
Behaviour Diagram: Activity, Use Case, Sequence, Communication, Interaction, State Machine
Structure Diagram: Class, Component, Package, Deployment, Object

Use case diagram
- Describe functional behavior of the system
- In user’s perspective
Class diagram
- Describe the static structure of the system
Sequence diagram
- Describe the dynamic behavior between actors and the system
Activity diagram
- Describe the dynamic behaviors of the system

Use Case Diagram
- Functional requirements: e.g., register user, send email, display picture
- Non-functional requirements: e.g., security (must use AES encryption), performance(must be done within 3 seconds)
- High level view of what system does
An actor model an external entity which interact with the system.
Use Case represents a class of functionality provided by the system.
System boundary represent the scope of the system.

Use Case Diagram Relationship
Types of relationship:
- Association relationship represents interaction between actors and use cases
-- Using a line to connect the actor and the use case
- Include relationship represents a use case includes the functionality of another use case
-- Using a dashed arrow to indicate including and included use case.
- Extend relationship represents optional or exceptional cases.
-- Using a dashed arrow and “extend” keyword.
- Generalization relationship represents one use case is a specialized version of another
-- Arrow pointing from specialized one to general one

