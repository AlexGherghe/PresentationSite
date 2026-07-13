---
title: "A Lot Of Unit Tests Are Worse Than Useless"
date: 2026-07-13
tags: [Computer Science]
excerpt: "Why your unit tests are likely not testing what you think they're testing"
---

## The Background

This article obviously represents my opinion about some of the unit tests I've seen and I think that it's important for all of us to be on the same page before starting this. 
First things first, I come from the Java world and I've mainly been working on backend systems. What I'm saying may not be that relevant for people doing native app development or game development (even though I think the principles behind what I'm saying are universal).

Secondly, I believe that **writing tests for your code is extremely important and you shouldn't ship anything without tests**. So this is by no means an argument **against** writing tests, it is an argument against writing a **certain type** of tests. 

Now that we've laid out the groundwork, let's jump to the main issue. 

## What Are You Actually Testing? 

If you spent any amount of time working on backend systems, you've more than likely implemented some **crud-like functionality**. And you've probably seen some tests that went like this: 

```java 
@Service
public class BookService {

    private final BookRepository bookRepository;
    private final BookValidator bookValidator;
    private final BookMapper bookMapper;
    private final SecurityService securityService;
    private final MetricsService metricsService;

    public BookService(
            BookRepository bookRepository,
            BookValidator bookValidator,
            BookMapper bookMapper,
            SecurityService securityService,
            MetricsService metricsService) {
        this.bookRepository = bookRepository;
        this.bookValidator = bookValidator;
        this.bookMapper = bookMapper;
        this.securityService = securityService;
        this.metricsService = metricsService;
    }

    public BookDto getBookById(Long id) {
        bookValidator.validateId(id);
        
        if (!securityService.hasReadPermission()) {
            throw new SecurityException("Unauthorized");
        }
        
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
                
        metricsService.incrementCounter("book.fetch.success");
        
        return bookMapper.toDto(book);
    }
}

@ExtendWith(MockitoExtension.class)
public class BookServiceTest {

    @Mock private BookRepository bookRepository;
    @Mock private BookValidator bookValidator;
    @Mock private BookMapper bookMapper;
    @Mock private SecurityService securityService;
    @Mock private MetricsService metricsService;

    @InjectMocks private BookService bookService;

    @Test
    public void testGetBookById_Success() {
        // Arrange
        Long bookId = 1L;
        Book book = new Book(bookId, "Book One", "Author One");
        BookDto bookDto = new BookDto(bookId, "Book One", "Author One");

        doNothing().when(bookValidator).validateId(bookId);
        when(securityService.hasReadPermission()).thenReturn(true);
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        when(bookMapper.toDto(book)).thenReturn(bookDto);
        doNothing().when(metricsService).incrementCounter("book.fetch.success");

        // Act
        BookDto result = bookService.getBookById(bookId);

        // Assert
        assertNotNull(result);
        assertEquals("Book One", result.getTitle());
        
        // Verify
        verify(bookValidator, times(1)).validateId(bookId);
        verify(securityService, times(1)).hasReadPermission();
        verify(bookRepository, times(1)).findById(bookId);
        verify(bookMapper, times(1)).toDto(book);
        verify(metricsService, times(1)).incrementCounter("book.fetch.success");
    }
}
```

Now looking at the code above, I want you to tell me something: **what application behavior does this test actually test?** What it does test is that the methods in `BookService` have been called in the right order. Great, does this give us any assurance whatsoever that the application behaves correctly? In my opinion, **absolutely not**.

All this test does is to mirror the **implementation** of the method, not the **behavior** of the method. You may say that, combined with unit tests for the dependencies, this tests gives us some assurance that the application behaves correctly. We'll get there in a bit. 

We talk a lot about **loose coupling** when writing production code, but, for some reason, we tend to ignore it completely when it comes to unit tests. That test is extremely **tightly coupled** with the implementation. This has two immense implications.

Firstly, it makes **refactoring a pain**. If you refactor the production code, then you will inevitably have to update a lot of tests and that will slow you down. "But now AI does the refactoring for us, so it's no problem" I hear you say. That's only partly correct, because you still have to read and to understand the extra code that the AI generated.

The second implication is even uglier. Tests are supposed to keep us from breaking the application when refactoring it (or modifying it in general). However, since refactoring means that we need to rewrite the tests anyways, **what assurance do they give anymore?** How do we know that we're not breaking the tests as well? The old tests (that should have given us peace of mind) were practically useless at their job. I repeat that, **useless**. 

Now let's talk about the "testing every unit leads to total coverage" approach. First things first, I believe that **test coverage is a very flawed metric**. Sure, by all means, every line of code should be covered by tests if possible. But test coverage does not tell us anything about the **quality** of tests. You can have an application that is 100% covered by tests and still be full of bugs. 
That little tangent aside, there is some merit to the "I tested every unit, so the system must work" school of thought. But it has a lot of caveats. The I/O of your app becomes a very large and bug-prone surface. Your app likely queries some sort of DB and **mocking that in tests leaves you wide open to bugs** in the queries or broken assumptions about what would be returned. I usually liked to spin up a DB instance and use `DataJpaTest` in my Spring apps, but that's not what most people would consider a unit test. And even if you do that, there's still the issue of the other I/Os, like file systems, other services, etc. 
Even more disconcerting is the fact that **every mock makes assumptions about a contract**. When you mock a service, you're making assumptions about the contract of that service. Make enough assumptions and eventually you're going to get some of them wrong. Sure, you can test the integration between these units using... well... integration tests, but then **what's the point of the unit tests anymore?** 

## Forget The Pyramid

The test pyramid is very well-known in developer circles (geometry pun intended) and it states that you should have loads of unit tests, fewer integration tests and very few end-to-end tests. If your focus is on how difficult it is to set up tests and how much time they take to run, then this makes perfect sense. But I would argue that, if your focus is **correctness**, then you should **forget the pyramid**.

The pyramid was evolved in a world where **monoliths** were the standard, but in the last decade most new services were microservices and a lot of the old monoliths were broken down into smaller services. A while back, I came across [this article](https://engineering.atspotify.com/2018/01/testing-of-microservices) from Spotify that describes their testing strategy. They are using a **honeycomb distribution** instead of a pyramid, with most of their tests being integration tests. If you think about it, it makes perfect sense. Microservices make it way easier to write integration tests and they strike the right balance of ease of running and complexity. I believe that, with the right integration tests setup, **you can do without the vast majority of unit tests** and actually be more bug-free. 

What does this look like in practice? If you're working on a Spring Boot microservice, tools like **Testcontainers** let you spin up a real database (or Kafka, or Redis, or whatever you need) inside your test suite. You write a test that hits your **actual** endpoint, goes through your **actual** service layer, queries your **actual** database, and returns an **actual** response. No mocks, no assumptions, no "I hope the real thing behaves the same way." You test the **behavior** of your application, not its wiring.

Yes, these tests are slower than the mock-heavy ones. But they **actually catch bugs**. I'll take a slower test that catches real issues over a fast one that just verifies method call order.

## When Unit Tests Actually Make Sense

I want to be clear: I'm not saying that unit tests are always useless. They **absolutely** have their place. The problem is that most of the unit tests I've seen in the wild are **testing the wrong things**.

Where unit tests genuinely shine is in testing **pure logic**. If you have a function that takes some input, does some computation, and returns an output with no side effects, that's a perfect candidate for a unit test. Think about things like: a pricing calculator that applies discounts based on a set of rules, a parser that turns a string into a structured object, a validator that checks whether a date range is valid, or a sorting algorithm that needs to handle edge cases.

These functions don't talk to a database. They don't call other services. They don't need mocks. You give them input, you check the output. That's it. And if you refactor the internals, the tests still pass because they test **what** the function does, not **how** it does it.

The issue is that a huge chunk of backend code is **just glue**. It takes data from here, transforms it a little, and puts it there. And we insist on unit-testing that glue with an **army of mocks**. That's the part I have a problem with.

## My Thoughts

If I had to boil this down to one sentence, it would be this: **test behavior, not implementation**.

A good test should not care about the internal wiring of your code. It should care about **what happens when a user (or another service) interacts with your application**. If your test breaks every time you rename a method or reorder some calls, it's not protecting you. It's **slowing you down** and giving you a **false sense of security**.

My personal approach is to write integration tests for anything that involves I/O or coordination between components, and to reserve unit tests for genuinely complex logic that lives in pure functions. Most CRUD-like code doesn't need unit tests at all if you have solid integration tests covering the endpoints.

Is this a controversial take? Perhaps. But I've seen too many codebases where teams spend more time maintaining their mocks than their production code. And at that point, you really have to ask yourself: **who is testing who?**
